using Hepzi.Application.Models;

namespace Hepzi.Application.Interfaces
{
    public interface IApplication
    {
        public string? ProcessClientRequest(User userIdentity, string request);
    }
}
