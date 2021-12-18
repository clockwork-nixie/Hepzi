using System.Net.WebSockets;

namespace Hepzi.Utilities.Interfaces
{
    public interface IWebSocket : IDisposable
    {
        Task Close(WebSocketCloseStatus status, string description, CancellationToken cancellationToken);
        Task<WebSocketReceiveResult> ReceiveAsync(ArraySegment<byte> buffer, CancellationToken cancellationToken);
        Task SendAsync(ArraySegment<byte> buffer, WebSocketMessageType type, bool isEndOfMessage, CancellationToken cancellationToken);

        WebSocketState State { get; }
    }
}