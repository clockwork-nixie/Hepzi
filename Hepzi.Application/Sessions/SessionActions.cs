using Hepzi.Utilities.Interfaces;

namespace Hepzi.Application.Sessions
{
    public class SessionActions
    {
        private SessionAction _current = new SessionAction(Array.Empty<byte>(), null, false);
        private readonly object _lock = new();


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
            }
        }

        public ISessionAction Current => _current;
    }
}
