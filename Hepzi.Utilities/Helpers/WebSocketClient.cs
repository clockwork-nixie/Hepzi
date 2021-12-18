using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using Newtonsoft.Json;
using System.Net.WebSockets;
using System.Text;

namespace Hepzi.Utilities.Helpers
{
    public sealed class WebSocketClient<TUser> : IApplicationClient<TUser>
        where TUser: UserIdentity
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private readonly byte[] _readBuffer;
        private readonly IWebSocketClientSettings _settings;
        private readonly IWebSocket _socket;


        public WebSocketClient(IWebSocket socket, IWebSocketClientSettings settings)
        {
            _settings = settings ?? throw new ArgumentNullException(nameof(settings));
            _socket = socket;

            _readBuffer = new byte[settings.WebSocketReadBufferSize];
        }


        public event IApplicationClient<TUser>.OnConnectHandler? OnConnect;
        public event IApplicationClient<TUser>.OnDataReceivedHandler? OnDataReceived;


        public void Dispose() => _socket?.Dispose();


        public async Task Run()
        {
            var stage = "reading credentials from socket";

            try
            {
                const int userIdSize = 8;
                const int loginTokenSize = 24;
                const int authenticationSize = userIdSize + loginTokenSize;

                var credentialString = await _socket.ReadWithTimeout(_readBuffer, authenticationSize, TimeSpan.FromSeconds(_settings.WebSocketInitialiseSeconds));

                stage = "checking credentials";

                if (!string.IsNullOrWhiteSpace(credentialString) &&
                    credentialString.Length != authenticationSize &&
                    !int.TryParse(credentialString.Substring(0, userIdSize), out var userId) &&
                    !credentialString.Skip(userIdSize).All(c => c.IsHexadecimal()))
                {
                    stage = "validating credentials";

                    var onConnect = OnConnect;
                    var user = onConnect == null ? null : onConnect(userId, credentialString.Substring(userIdSize));

                    if (user != null)
                    {
                        stage = "entering main loop";

                        try
                        {
                            while (!user.Cancellation.IsCancellationRequested)
                            {
                                stage = "reading data from client";

                                var input = await _socket.Read(_readBuffer, user.Cancellation);

                                if (input == null)
                                {
                                    break;
                                }

                                stage = "processing data from client";
                                if (!user.Cancellation.IsCancellationRequested)
                                {
                                    var onDataReceived = OnDataReceived;
                                    var output = onDataReceived == null ? null : onDataReceived(user.User, input);

                                    stage = "sending response to client";

                                    if (!user.Cancellation.IsCancellationRequested && output != null)
                                    {
                                        await _socket.SendAsync(
                                            new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(output))),
                                            WebSocketMessageType.Text, true, user.Cancellation);
                                    }
                                }
                                stage = "continuing main loop";
                            }
                        }
                        finally
                        {
                            stage = "cancelling user";
                            if (!user.Cancellation.IsCancellationRequested)
                            {
                                user.Cancel();
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
    }
}
