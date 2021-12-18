using Hepzi.Application.Models;
using Hepzi.Utilities.Models;

namespace Hepzi.Application.Interfaces
{
    public interface IUserRepository
    {
        UserIdentity? GetUserByUserId(int userId);
        User? GetUserByUsername(string username);
    }
}
