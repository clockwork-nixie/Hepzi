using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface IWebSocketClientFactory<TUser>
        where TUser : UserIdentity
    {
        IApplicationClient<TUser> CreateClient(IWebSocket socket);
    }
}