using Hepzi.Application.Helpers;
using Hepzi.Application.Sessions;
using Hepzi.Utilities.Interfaces;

namespace Hepzi.Application.Models
{
    public class InitialSessionAction : ISessionAction
    {
        private InitialSessionAction(byte[] buffer, int targetUserId)
        {
            Buffer = buffer;
            TargetUserId = targetUserId;
        }


        public byte[] Buffer { get; }
        public int? ExcludeUserId { get; }
        public bool IsTerminal => false;
        public ISessionAction? Next { get; set; }
        public int? TargetUserId { get;}
                

        public static ISessionAction BuildInitialActionChain(Session<ZoneSessionState> target, Session<ZoneSessionState>[] sessions, ISessionAction actionChain)
        {
            var head = actionChain;

            foreach (var session in sessions.Where(s => s.UserId != target.UserId))
            {
                head = new InitialSessionAction(session.InitialInstanceSession(), target.UserId) { Next = head };
            }

            head = new InitialSessionAction(target.InitialInstanceSession(), target.UserId) { Next = head };

            return new InitialSessionAction(Array.Empty<byte>(), target.UserId) { Next = head };
        }
    }
}
