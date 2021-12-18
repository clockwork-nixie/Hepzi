using Hepzi.Application.Models;
using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface ILoginServer<TUser>
        where TUser : UserIdentity
    {
        UserIdentity? AuthenticateUser(string username, string password);
        ValidatedUser<TUser>? ValidateUser(int userId, string session);
    }
}
