using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using System.Net.WebSockets;

namespace Hepzi.Utilities.Helpers
{
    public sealed class WebSocketClient: ISessionClient
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private Thread? _outboundThread;
        private readonly byte[] _readBuffer;
        private readonly ManualResetEventSlim _run = new(true);
        private readonly IWebSocketClientSettings _settings;
        private readonly IWebSocket _socket;

        
        private class ThreadState
        {
            public ThreadState(SessionWelcome welcome)
            {
                Cancellation = welcome.Session.Cancellation;
                Outbounds = welcome.GetActions();
                UserId = welcome.Session.UserId;
            }

            public CancellationToken Cancellation { get; }
            public ISessionAction Outbounds { get; }
            public int UserId { get; }
        }


        public WebSocketClient(IWebSocket socket, IWebSocketClientSettings settings)
        {
            _settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _socket = socket;
            _readBuffer = new byte[settings.WebSocketReadBufferSize];
        }


        public event ISessionClient.OnConnectHandler? OnConnect;


        public void Dispose() => _socket?.Dispose();


        public static async Task<int> Read(IWebSocket socket, byte[] buffer, ISession session)
        {
            var readPosition = 0;

            try
            {
                while (readPosition < buffer.Length && socket.State == WebSocketState.Open && !session.Cancellation.IsCancellationRequested)
                {
                    var readResult = await socket.ReceiveAsync(new ArraySegment<byte>(buffer, readPosition, buffer.Length - readPosition), session.Cancellation);

                    if (readResult.CloseStatus == null)
                    {
                        readPosition += readResult.Count;

                        if (readResult.EndOfMessage)
                        {
                            if (readResult.MessageType != WebSocketMessageType.Binary)
                            {
                                Logger.Warn($"Received non-binary message from client during read: aborting session {session.SessionId} for user {session.UserId}.");
                                return -1;
                            }

                            return readPosition;
                        }
                    }
                }

                if (readPosition >= buffer.Length)
                {
                    Logger.Error($"Overran buffer during read: aborting session {session.SessionId} for user {session.UserId}.");
                }
            }
            catch (OperationCanceledException)
            {
                // Silently ignore cancellations.
            }
            catch (Exception exception)
            {
                Logger.Error(exception, $"Exception during timed read: aborting session {session.SessionId} for user {session.UserId}.");
            }

            return -1;
        }


        public static async Task<int> ReadWithTimeout(IWebSocket socket, byte[] buffer, int maximumSize, TimeSpan timeout)
        {
            try
            {
                var finishTime = DateTime.UtcNow.Add(timeout);
                var readPosition = 0;

                while (readPosition < maximumSize && socket.State == WebSocketState.Open)
                {
                    var timeLeft = finishTime - DateTime.UtcNow;

                    if (timeLeft < TimeSpan.Zero)
                    {
                        Logger.Info("Timed out on timed read: closing client connection.");
                        return -1;
                    }

                    var readTask = socket.ReceiveAsync(new ArraySegment<byte>(buffer, readPosition, maximumSize - readPosition), CancellationToken.None);

                    if (readTask.Wait(timeLeft))
                    {
                        var readResult = await readTask;

                        if (readResult.CloseStatus == null)
                        {
                            readPosition += readResult.Count;

                            if (readResult.EndOfMessage)
                            {
                                if (readResult.MessageType != WebSocketMessageType.Binary)
                                {
                                    Logger.Warn("Received non-binary message from client during timed read: aborting client.");
                                    return -1;
                                }

                                return readPosition;
                            }
                        }
                    }
                }

                if (readPosition >= buffer.Length)
                {
                    Logger.Error("Overran buffer during timed read: aborting client.");
                }
            }
            catch (Exception exception)
            {
                Logger.Error(exception, "Exception during timed read: aborting client.");
            }

            return -1;
        }


        public async Task Run()
        {
            var stage = "reading credentials from socket";

            try
            {
                const int authenticationSize = sizeof(int) * 2;

                var credentialsLength = await ReadWithTimeout(_socket, _readBuffer, authenticationSize, TimeSpan.FromSeconds(_settings.WebSocketInitialiseSeconds));

                stage = "checking credentials";

                if (credentialsLength == authenticationSize)
                {
                    var credentials = new BufferWrapper(_readBuffer, credentialsLength);
                    var userId = credentials.ReadInt();
                    var sessionId = credentials.ReadInt();

                    var onConnect = OnConnect;
                    var welcome = onConnect == null ? null : onConnect(userId, sessionId);

                    if (welcome != null && !welcome.Session.Cancellation.IsCancellationRequested)
                    {
                        var session = welcome.Session;
                        var threadControl = new ThreadState(welcome);

                        await _socket.SendAsync(welcome.Message, WebSocketMessageType.Binary, true, session.Cancellation);
                                                
                        _outboundThread = new Thread(async (state) => await RunOutboundThread(state)) { Name = $"Outbound for #{session.SessionId}" };
                        _outboundThread.Start(threadControl);

                        stage = "entering main loop";

                        try
                        {
                            while (!session.Cancellation.IsCancellationRequested)
                            {
                                stage = "reading data from client";

                                var inputLength = await Read(_socket, _readBuffer, session);

                                // The wait implements a timeout after client-kill to allow the socket to drain.
                                // Once the client closes the socket the session will drop, but if the client
                                // refuses to die we close after a timeout anyway (to prevent Agent Smit situations).
                                if (inputLength < 0 || !_run.Wait(TimeSpan.FromSeconds(10), session.Cancellation))
                                {
                                    break;
                                }

                                stage = "processing data from client";
                                if (!session.Cancellation.IsCancellationRequested)
                                {
                                    stage = "sending request to instance";

                                    if (!session.Send(new ArraySegment<byte>(_readBuffer, 0, inputLength), welcome.Token))
                                    {
                                        // TODO: error message?
                                        session.Cancel();
                                    }
                                }
                                stage = "continuing main loop";
                            }
                        }
                        finally
                        {
                            // TODO: make more robust
                            if (!session.Cancellation.IsCancellationRequested)
                            {
                                session.Cancel();
                            }
                             
                            if (welcome?.Token != null)
                            {
                                session.LeaveInstance(welcome.Token);
                            }

                            if (_outboundThread != null)
                            {
                                _outboundThread.Join();
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Logger.Error(exception, $"Error while {stage}");
            }
        }


        private async Task RunOutboundThread(object? parameter)
        {
            var state = parameter as ThreadState;

            if (state != null)
            {
                try
                {
                    var outbounds = state.Outbounds;
                    var cancellation = state.Cancellation;

                    while (!cancellation.IsCancellationRequested && _socket.State == WebSocketState.Open)
                    {
                        // TODO: rework to optimise traffic.
                        while (outbounds.Next != null)
                        {
                            outbounds = outbounds.Next;

                            if (outbounds.TargetUserId == null || outbounds.TargetUserId == state.UserId)
                            {
                                if (outbounds.IsTerminal)
                                {
                                    _run.Reset();
                                }

                                if (outbounds.Buffer.Length > 0)
                                {
                                    await _socket.SendAsync(outbounds.Buffer, WebSocketMessageType.Binary, true, cancellation);
                                }
                            }
                        }

                        Thread.Sleep(50);
                    }
                }
                catch (OperationCanceledException)
                {
                    // IGNORE
                }
                catch (Exception exception)
                {
                    Logger.Error(exception, $"Exception in {nameof(RunOutboundThread)}");
                }
            }
        }
    }
}
