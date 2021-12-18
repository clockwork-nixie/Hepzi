using Hepzi.Utilities.Models;

namespace Hepzi.Application.Models
{
    public class User : UserIdentity
    {
        public User(string username, string password, int userId) : base(username, userId) => Password = password;
        

        public string Password { get; private set; }
    }   
}
