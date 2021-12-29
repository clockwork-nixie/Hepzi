using Hepzi.Application.Models;
using Hepzi.Utilities.Interfaces;

namespace Hepzi.Application.Sessions
{
    public class SessionActions : IDisposable
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private SessionAction _current = new SessionAction(Array.Empty<byte>(), null, false);
        private readonly CancellationTokenSource _cancellation = new();
        private readonly Func<ICollection<Session<ZoneSessionState>>> _getSessions;
        private readonly object _lock = new();
        private Thread? _thread;
        private readonly AutoResetEvent _threadRelease = new(true);


        public SessionActions(Func<ICollection<Session<ZoneSessionState>>> getSessions)
        {
            _getSessions = getSessions;
            _thread = new Thread(() => Run()) { IsBackground = true, Name = nameof(SessionActions) };
        }


        private sealed class SessionAction : ISessionAction
        {
            public SessionAction(byte[] buffer, int? targetUserId, bool isTerminal)
            {
                Buffer = buffer;
                IsTerminal = isTerminal;
                TargetUserId = targetUserId;
            }

            public byte[] Buffer { get; }
            public bool IsTerminal { get; }
            public ISessionAction? Next { get; internal set; }
            public int? TargetUserId { get; }
        }


        public void AddAction(byte[] buffer, int? targetUserId = null, bool isTerminal = false)
        {
            lock (_lock)
            {
                var action = new SessionAction(buffer, targetUserId, isTerminal);

                _current.Next = action;
                _current = action;
                _threadRelease.Set();
            }
        }


        public void Cancel() => _cancellation.Cancel();


        public ISessionAction Current => _current;


        public void Dispose()
        { 
            _cancellation.Cancel();
            _threadRelease.Set();

            // The thread does very little work and the cycle time should be way less than a second,
            // but as there will be a flurry of activity at shutdown time, allow a significant period
            // and don't bother to make it configurable because we really don't care that much.
            Thread? thread;

            lock (_lock)
            {
                thread = _thread;
                _thread = null;

                if (thread?.Join(TimeSpan.FromSeconds(5)) == false)
                {
                    Logger.Warn($"Failed to join ${nameof(SessionActions)} thread.");
                }
            }
        }
        
        
        private void Run()
        {
            try
            {
                var waitHandles = new[] { _cancellation.Token.WaitHandle, _threadRelease };

                while (!_cancellation.IsCancellationRequested)
                {                    
                    foreach (var session in _getSessions())
                    {
                        try
                        {
                            session.ActionsReady.Set();
                        }
                        catch (ObjectDisposedException)
                        {
                            // IGNORE
                        }
                    }
                    _cancellation.Token.WaitHandle.WaitOne(TimeSpan.FromMilliseconds(5)); // Prevent busy-wait
                    WaitHandle.WaitAny(waitHandles);
                }
            }
            catch (OperationCanceledException)
            {

                // IGNORE
            }
            catch (Exception exception) when (!(exception is ThreadAbortException))
            {
                Logger.Error(exception, $"{nameof(SessionActions)} thread suffered terminal exception.");
            }
        }


        public void StartWorker() => _thread?.Start();
    }
}
