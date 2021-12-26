using Hepzi.Application.Models;

namespace Hepzi.Application.Interfaces
{
    public interface IUserRepository
    {
        User? GetUserByUsername(string username);
    }
}
