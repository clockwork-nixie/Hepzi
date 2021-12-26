namespace Hepzi.Utilities.Interfaces
{
    public interface IWebSocketClientFactory
    {
        ISessionClient CreateClient(IWebSocket socket);
    }
}