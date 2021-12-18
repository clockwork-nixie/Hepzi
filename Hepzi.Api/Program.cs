using Hepzi.Api.Helpers;
using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using Hepzi.Application.Servers;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using NLog.Web;


var builder = WebApplication.CreateBuilder(args);

builder.Host.ConfigureWebHostDefaults(webBuilder => 
    webBuilder
        .UseWebRoot(@".\Public")
        .UseKestrel(options => options.ListenAnyIP(443, o => o.UseHttps())))
    .ConfigureLogging(logging => {
            logging.ClearProviders();
            logging.SetMinimumLevel(LogLevel.Trace);
        })
    .UseNLog();


var services = builder.Services;

services.AddControllers();
services.AddSingleton<IWebSocketClientFactory<User>, WebSocketClientFactory<User>>();
services.AddSingleton<IWebSocketClientSettings, IWebSocketClientSettings>();
services.AddSingleton<ILoginServer<User>, LoginServer>();
services.AddSingleton<IUserRepository, MemoryUserRepository>();


var application = builder.Build();

if (builder.Environment.IsDevelopment())
{
    application.UseDeveloperExceptionPage();
}

application.UseHttpsRedirection();
application.UseRouting();
application.UseAuthorization();
application.UseStaticFiles();
application.Use(ApiPlugins.HandleSocketSession);
application.Use(ApiPlugins.RedirectRootToLandingPage);
application.MapControllers();


application.Run();