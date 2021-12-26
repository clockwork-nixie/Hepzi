using Hepzi.Application.Models;
using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using System.Collections.Concurrent;

namespace Hepzi.Utilities.Servers
{
    public class InstanceServer<TData> : IInstanceServer
        where TData : class, new()
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private readonly IInstance<TData> _instance;
        private readonly int _maximumCreateAttempts;
        private readonly ConcurrentDictionary<int, Session<TData>> _sessionsByUserId = new();


        public InstanceServer(IInstance<TData> instance)
        {
            _instance = instance ?? throw new ArgumentNullException(nameof(instance));
            _maximumCreateAttempts = 3; // TODO: settings
        }


        public ISession? AddSession(string username, int userId)
        {
            var session = new Session<TData>(username, userId);
            var attempts = 0;

            while (!_sessionsByUserId.TryAdd(session.UserId, session))
            {
                if (_sessionsByUserId.TryRemove(session.UserId, out var removedUser))
                {
                    Logger.Info($"Session for {session.UserId} ({session.Username}) superseded.");
                    removedUser.Cancel();
                }

                // If two sessions for the same user try to login at the same time, we may get a (safe) race condition.
                // We can retry and it should now be fine; if it still isn't it's probably some DoS attach on that user.
                if (++attempts >= _maximumCreateAttempts)
                {
                    Logger.Warn($"Session registration for {session.UserId} ({session.Username}) abandoned after {attempts} attempts.");
                    return null;
                }
            }

            session.SetInstance(_instance);

            return session;
        }


        public SessionWelcome? JoinInstance(int userId, int sessionId)
        {
            _sessionsByUserId.TryGetValue(userId, out var session);

            return session == null ? null : session.JoinInstance(sessionId);
        }
    }
}
