namespace Hepzi.Utilities.Interfaces
{
    public interface ISessionAction
    {
        byte[] Buffer { get; }
        bool IsTerminal { get; }
        ISessionAction? Next { get; }
        int? TargetUserId { get; }
    }
}
