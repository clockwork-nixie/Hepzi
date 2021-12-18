using Hepzi.Application.Models;
using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface IApplicationClient<TUser> : IDisposable
        where TUser : UserIdentity
    {
        delegate ValidatedUser<TUser>? OnConnectHandler(int userId, string session);
        delegate string? OnDataReceivedHandler(TUser user, string data);

        event OnConnectHandler? OnConnect;
        event OnDataReceivedHandler? OnDataReceived;

        Task Run();
    }
}