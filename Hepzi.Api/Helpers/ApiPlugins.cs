using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using System.Net.WebSockets;

namespace Hepzi.Api.Helpers
{
    public static class ApiPlugins
    {
        public static async Task HandleSocketSession(HttpContext context, Func<Task> next)
        {
            if (context.WebSockets.IsWebSocketRequest && context.Request.Path == "/client")
            {
                using var socket = await context.WebSockets.AcceptWebSocketAsync();

                if (socket?.State == WebSocketState.Open)
                {
                    var clientFactory = (IWebSocketClientFactory<User>?)context.RequestServices.GetService(typeof(IWebSocketClientFactory<User>));
                    var loginServer = (ILoginServer<User>?)context.RequestServices.GetService(typeof(ILoginServer<User>));
                    var applicationServer = (IApplication?)context.RequestServices.GetService(typeof(IApplication));

                    if (clientFactory == null || loginServer == null || applicationServer == null)
                    {
                        // TODO: Log
                    }
                    else
                    {
                        var client = clientFactory.CreateClient(new WebSocketWrapper(socket));

                        client.OnConnect += loginServer.ValidateUser;
                        client.OnDataReceived += applicationServer.ProcessClientRequest;

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