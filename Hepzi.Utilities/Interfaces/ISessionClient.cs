using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface ISessionClient : IDisposable
    {
        delegate SessionWelcome? OnConnectHandler(int userId, int sessionId);

        event OnConnectHandler? OnConnect;

        Task Run();
    }
}