namespace Hepzi.Utilities.Models
{
    public class UserIdentity
    {
        public UserIdentity(string username, int userId)
        {
            Username = username;
            UserId = userId;
        }


        public int UserId { get; }
        public string Username { get; }
    }
}
