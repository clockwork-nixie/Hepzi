using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;

namespace Hepzi.Application.Models
{
    public class Session<TData> : ISession
        where TData : class, new()
    {
        private readonly CancellationTokenSource _cancellation = new();
        private DateTime _expiresAt;
        private IInstance<TData>? _instance;
        private readonly object _sessionIdLock = new();
        private object? _token = new();


        public Session(string username, int userId)
        {
            State = new TData();
            UserId = userId;
            Username = username;
        }


        public CancellationToken Cancellation => _cancellation.Token;
        public int SessionId { get; private set; }
        public TData State { get; }
        public int UserId { get; }
        public string Username { get; }


        public void Cancel() => _cancellation.Cancel();
        public bool HasToken(object token) => token == _token;


        public SessionWelcome? JoinInstance(int sessionIdRequested)
        {
            SessionWelcome? welcome = null;

            if (_token == null)
            {
                lock (_sessionIdLock)
                {
                    if (_token == null && SessionId == sessionIdRequested && _instance != null)
                    {
                        if (DateTime.UtcNow <= _expiresAt)
                        {
                            _token = new();
                            welcome = _instance.AddSession(this, _token);
                        }
                    }
                }
            }

            return welcome;
        }


        public void LeaveInstance(object token)
        {
            lock (_sessionIdLock)
            {
                var instance = _instance;
                
                _instance = null;
                instance?.RemoveSession(this, token);
            }
        }


        public void SetInstance(IInstance<TData> instance)
        {
            lock (_sessionIdLock)
            {
                _expiresAt = DateTime.UtcNow.Add(instance.ConnectionTimeout);
                _instance = instance;
                _token = null;

                var newSessionId = Guid.NewGuid().ToString("N").GetHashCode();

                SessionId = (newSessionId == SessionId) ? ~newSessionId : newSessionId;
            }
        }


        public bool Send(ArraySegment<byte> data, object token)
        {
            var safeInstance = _instance;

            return safeInstance?.ProcessClientRequest(this, data, token) == true;
        }
    }
}
