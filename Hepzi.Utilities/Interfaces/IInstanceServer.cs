using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface IInstanceServer
    {
        ISession? AddSession(string username, int userId);
        SessionWelcome? JoinInstance(int userId, int sessionId);
    }
}
