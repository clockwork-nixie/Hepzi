using Hepzi.Utilities.Interfaces;
using System.Net.WebSockets;
using System.Text;

namespace Hepzi.Utilities.Helpers
{
    public static class WebSocketHelpers
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();


        public static async Task<string?> Read(this IWebSocket socket, byte[] buffer, CancellationToken cancellation)
        {
            var readPosition = 0;

            try
            {
                while (readPosition < buffer.Length && socket.State == WebSocketState.Open && !cancellation.IsCancellationRequested)
                {
                    var readResult = await socket.ReceiveAsync(new ArraySegment<byte>(buffer, readPosition, buffer.Length - readPosition), CancellationToken.None);

                    if (readResult.CloseStatus == null)
                    {
                        readPosition += readResult.Count;

                        if (readResult.EndOfMessage)
                        {
                            return readResult.MessageType == WebSocketMessageType.Text ? Encoding.ASCII.GetString(buffer, 0, readPosition) : null;
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Logger.Error(exception, "Exception while reading client message from socket.");
            }

            return null;
        }


        public static async Task<string?> ReadWithTimeout(this IWebSocket socket, byte[] buffer, int maximumSize, TimeSpan timeout)
        {
            try
            {
                var finishTime = DateTime.UtcNow.Add(timeout);
                var readPosition = 0;

                while (readPosition < maximumSize && socket.State == WebSocketState.Open)
                {
                    var timeLeft = finishTime - DateTime.UtcNow;

                    if (timeLeft < TimeSpan.Zero)
                    {
                        return null;
                    }

                    var readTask = socket.ReceiveAsync(new ArraySegment<byte>(buffer, readPosition, maximumSize - readPosition), CancellationToken.None);

                    if (readTask.Wait(timeLeft))
                    {
                        var readResult = await readTask;

                        if (readResult.CloseStatus == null)
                        {
                            readPosition += readResult.Count;

                            if (readResult.EndOfMessage)
                            {
                                return readResult.MessageType == WebSocketMessageType.Text? Encoding.ASCII.GetString(buffer, 0, readPosition): null;
                            }
                        }
                    }
                }
            }
            catch (Exception exception)
            {
                Logger.Error(exception, "Exception while initialising client from socket.");
            }

            return null;
        }
    }
}
