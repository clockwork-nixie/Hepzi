using Hepzi.Application.Sessions;
using Hepzi.Utilities.Interfaces;

namespace Hepzi.Application.Interfaces
{
    public interface IZoneInstance : IInstance<ZoneSessionState>, IDisposable { }
}
