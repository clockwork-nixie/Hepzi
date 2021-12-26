using Hepzi.Api.Helpers;
using Hepzi.Api.Models;
using Hepzi.Application.Interfaces;
using Hepzi.Application.Servers;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using NLog.Web;


var builder = WebApplication.CreateBuilder(new WebApplicationOptions {
    WebRootPath = @".\Public",
    Args = args
});

builder.Host.ConfigureLogging(logging => {
    logging.ClearProviders();
    logging.SetMinimumLevel(LogLevel.Trace);
}).UseNLog();

var services = builder.Services;
var applicationSettings = new ApplicationSettings {
    WebSocketInitialiseSeconds = 5,
    WebSocketReadBufferSize = 8096
};

services.AddControllers();
services.AddSingleton<IZoneInstanceServer, ZoneInstanceServer>();
services.AddSingleton<ILoginServer, LoginServer>();
services.AddSingleton<IUserRepository, MemoryUserRepository>();
services.AddSingleton<IWebSocketClientFactory, WebSocketClientFactory>();
services.AddSingleton<IWebSocketClientSettings>((IServiceProvider provider) => applicationSettings);
services.AddTransient<IZoneInstance, ZoneInstance>();

var application = builder.Build();

if (builder.Environment.IsDevelopment())
{
    application.UseDeveloperExceptionPage();
}

application.UseHttpsRedirection();
application.UseRouting();
application.UseAuthorization();
application.UseStaticFiles();
application.UseWebSockets();
application.Use(ApiPlugins.HandleSocketSession<IZoneInstanceServer>);
application.Use(ApiPlugins.RedirectRootToLandingPage);
application.MapControllers();


application.Run();