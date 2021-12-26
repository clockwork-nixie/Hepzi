using Hepzi.Application.Interfaces;
using Hepzi.Utilities.Interfaces;

namespace Hepzi.Application.Servers
{
    public class LoginServer : ILoginServer
    {
        private readonly IInstanceServer _instanceServer;
        private readonly IUserRepository _repository;


        public LoginServer(IZoneInstanceServer instanceServer, IUserRepository repository)
        {
            _instanceServer = instanceServer ?? throw new ArgumentNullException(nameof(instanceServer));
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        }


        public ISession? CreateSession(string username, string password)
        {
            var user = _repository.GetUserByUsername(username);

            if (user != null && user.Password == password)
            {
                return _instanceServer.AddSession(user.Username, user.UserId);
            }

            return null;
        }
    }
}
