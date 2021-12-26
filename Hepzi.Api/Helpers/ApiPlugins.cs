using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using System.Net.WebSockets;

namespace Hepzi.Api.Helpers
{
    public static class ApiPlugins
    {
        public static async Task HandleSocketSession<TServer>(HttpContext context, Func<Task> next)
            where TServer : IInstanceServer
        {
            if (context.WebSockets.IsWebSocketRequest && context.Request.Path == "/client")
            {
                using var socket = await context.WebSockets.AcceptWebSocketAsync();

                if (socket?.State == WebSocketState.Open)
                {
                    var clientFactory = (IWebSocketClientFactory?)context.RequestServices.GetService(typeof(IWebSocketClientFactory));
                    var instanceServer = (TServer?)context.RequestServices.GetService(typeof(TServer));

                    if (clientFactory == null || instanceServer == null)
                    {
                        // TODO: Log
                    }
                    else
                    {
                        var client = clientFactory.CreateClient(new WebSocketWrapper(socket));

                        client.OnConnect += instanceServer.JoinInstance;

                        await client.Run();
                    }
                }
            }
            else
            {
                await next();
            }
        }


        public static async Task RedirectRootToLandingPage(HttpContext context, Func<Task> next)
        {
            if (context?.Request?.Path.Value == "/")
            {
                context.Response.Redirect("index.html");
                return;
            }

            await next();
        }
    }
}