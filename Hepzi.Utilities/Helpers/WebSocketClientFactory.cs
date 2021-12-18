using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Helpers
{
    public class WebSocketClientFactory<TUser> : IWebSocketClientFactory<TUser>
        where TUser : UserIdentity
    {
        public WebSocketClientFactory(IWebSocketClientSettings settings) => Settings = settings ?? throw new ArgumentNullException(nameof(settings));

        public IWebSocketClientSettings Settings { get; }

        public IApplicationClient<TUser> CreateClient(IWebSocket socket) => new WebSocketClient<TUser>(socket, Settings);
    }
}