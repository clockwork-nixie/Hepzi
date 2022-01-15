namespace Hepzi.Utilities.Interfaces
{
    public interface ISession
    {
        AutoResetEvent ActionsReady { get; }
        CancellationToken Cancellation { get; }
        int SessionId { get; }
        int UserId { get; }
        string Username { get; }

        void Cancel();
        bool HasToken(object token);
        void LeaveInstance(object token);
        bool Send(ArraySegment<byte> data, object token);
    }
}
