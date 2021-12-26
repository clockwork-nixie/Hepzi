namespace Hepzi.Utilities.Interfaces
{
    public interface ILoginServer
    {
        ISession? CreateSession(string username, string password);
    }
}
