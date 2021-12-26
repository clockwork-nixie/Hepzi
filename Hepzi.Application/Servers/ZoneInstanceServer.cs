using Hepzi.Application.Interfaces;
using Hepzi.Application.Sessions;
using Hepzi.Utilities.Servers;

namespace Hepzi.Application.Servers
{
    public class ZoneInstanceServer : InstanceServer<ZoneSessionState>, IZoneInstanceServer
    {
        public ZoneInstanceServer(IZoneInstance instance) : base(instance) { }
    }
}
