using Hepzi.Utilities.Interfaces;
using System.Net.WebSockets;

namespace Hepzi.Utilities.Helpers
{
    public class WebSocketWrapper : IWebSocket
    {
        private readonly WebSocket _socket;


        public WebSocketWrapper(WebSocket socket) => _socket = socket ?? throw new ArgumentNullException(nameof(socket));

        public Task Close(WebSocketCloseStatus status, string description, CancellationToken cancellationToken) => _socket.CloseAsync(status, description, cancellationToken);

        public void Dispose() => _socket.Dispose();

        public Task<WebSocketReceiveResult> ReceiveAsync(ArraySegment<byte> buffer, CancellationToken cancellationToken) => _socket.ReceiveAsync(buffer, cancellationToken);

        public Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType type, bool isEndOfMessage, CancellationToken cancellationToken) => _socket.SendAsync(buffer, type, isEndOfMessage, cancellationToken);

        public WebSocketState State => _socket.State;
    }
}