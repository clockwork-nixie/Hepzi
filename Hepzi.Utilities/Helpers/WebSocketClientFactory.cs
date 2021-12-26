using Hepzi.Utilities.Interfaces;

namespace Hepzi.Utilities.Helpers
{
    public class WebSocketClientFactory : IWebSocketClientFactory
    {
        private readonly IWebSocketClientSettings _settings;

        public WebSocketClientFactory(IWebSocketClientSettings settings) => _settings = settings ?? throw new ArgumentNullException(nameof(settings));

        public ISessionClient CreateClient(IWebSocket socket) => new WebSocketClient(socket, _settings);
    }
}