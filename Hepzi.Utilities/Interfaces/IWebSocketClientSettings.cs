namespace Hepzi.Utilities.Interfaces
{
    public interface IWebSocketClientSettings
    {
        double WebSocketInitialiseSeconds { get; }
        int WebSocketReadBufferSize { get; }
    }
}