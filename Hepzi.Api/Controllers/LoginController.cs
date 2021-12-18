using Hepzi.Application.Models;
using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using Microsoft.AspNetCore.Mvc;

namespace Hepzi.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly ILogger<LoginController> _logger;
        private readonly ILoginServer<User> _loginServer;

        public LoginController(ILogger<LoginController> logger, ILoginServer<User> loginServer)
        {
            _logger = logger;
            _loginServer = loginServer;
        }
        


        public class Credentials
        {
            public string? Password { get; set; }
            public string? Username { get; set; }
        }


        [HttpPost]
        public ActionResult<UserIdentity> Authenticate([FromBody] Credentials? credentials)
        {
            ActionResult<UserIdentity> result;
            var user = credentials?.Username != null && credentials.Password != null?
                _loginServer.AuthenticateUser(credentials.Username, credentials.Password):
                null;

            if (user == null)
            {
                _logger.LogTrace($">>> {nameof(LoginController)}.{nameof(Authenticate)} => Unauthorised ({credentials?.Username})");
                result = Unauthorized();
            }
            else
            {
                _logger.LogTrace($">>> {nameof(LoginController)}.{nameof(Authenticate)} => OK ({credentials?.Username})");
                result = user;
            }

            return result;
        }
    }
}   
