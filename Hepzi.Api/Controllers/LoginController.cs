using Hepzi.Api.Models;
using Hepzi.Utilities.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hepzi.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoginController : ControllerBase
    {
        private readonly ILogger<LoginController> _logger;
        private readonly ILoginServer _loginServer;

        public LoginController(ILogger<LoginController> logger, ILoginServer loginServer)
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
        public ActionResult<LoginResponse> Authenticate([FromBody] Credentials? credentials)
        {
            ActionResult<LoginResponse> response;
            var result = credentials?.Username != null && credentials.Password != null?
                _loginServer.CreateSession(credentials.Username, credentials.Password):
                null;

            if (result == null)
            {
                _logger.LogTrace($">>> {nameof(LoginController)}.{nameof(Authenticate)} => Unauthorised ({credentials?.Username})");
                response = Unauthorized();
            }
            else
            {
                _logger.LogTrace($">>> {nameof(LoginController)}.{nameof(Authenticate)} => OK ({credentials?.Username})");
                response = new LoginResponse(result);
            }

            return response;
        }
    }
}   
