using Hepzi.Utilities.Interfaces;

namespace Hepzi.Api.Models
{
    public class LoginResponse
    {
        public LoginResponse(Utilities.Interfaces.ISession user)
        {
            SessionId = user.SessionId;
            Username = user.Username;
            UserId = user.UserId;
        }


        public int SessionId { get; }
        public int UserId { get; }
        public string Username { get; }
    }
}
    