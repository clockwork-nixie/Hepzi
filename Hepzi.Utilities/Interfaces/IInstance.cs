using Hepzi.Application.Models;
using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Interfaces
{
    public interface IInstance<TData>
        where TData : class, new()
    {
        TimeSpan ConnectionTimeout { get; }

        SessionWelcome? AddSession(Session<TData> session, object token);
        bool ProcessClientRequest(ISession user, ArraySegment<byte> data, object token);
        void RemoveSession(ISession session, object token);
    }
}
