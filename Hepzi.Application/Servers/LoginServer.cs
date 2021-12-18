using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using System.Collections.Concurrent;

namespace Hepzi.Application.Servers
{
    public class LoginServer : ILoginServer<User>
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private readonly IUserRepository _repository;
        private readonly ConcurrentDictionary<int, ValidatedUser<User>> _usersByUserId = new ConcurrentDictionary<int, ValidatedUser<User>>();


        public LoginServer(IUserRepository repository) => _repository = repository ?? throw new ArgumentNullException(nameof(repository));


        public UserIdentity? AuthenticateUser(string username, string password)
        {
            var user = _repository.GetUserByUsername(username);

            if (user != null && user.Password == password)
            {
                var session = Guid.NewGuid().ToString("N");
                var newUser = new ValidatedUser<User>(user, session, new CancellationTokenSource());
                var attempts = 0;

                while (!_usersByUserId.TryAdd(user.UserId, newUser))
                {
                    if (_usersByUserId.TryRemove(user.UserId, out var removedUser))
                    {
                        Logger.Info($"Session for {user.UserId} ({user.Username}) superseded.");
                        removedUser.Cancel();
                    }

                    if (++attempts >= 20)
                    {
                        Logger.Warn($"Session registration for {user.UserId} ({user.Username}) abandoned after {attempts} attempts.");
                        return null;
                    }
                }
            }

            return user;
        }


        public ValidatedUser<User>? ValidateUser(int userId, string session)
        {
            _usersByUserId.TryGetValue(userId, out var user);

            return user != null && user.Session == session? user: null;
        }
    }
}
