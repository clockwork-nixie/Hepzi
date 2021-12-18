using Hepzi.Utilities.Interfaces;

namespace Hepzi.Api.Models
{
    public class ApplicationSettings : IWebSocketClientSettings
    {
        public double WebSocketInitialiseSeconds { get; set; }
        public int WebSocketReadBufferSize { get; set; }
        public int WebSocketWriteBufferSize { get; set; }
    }
}