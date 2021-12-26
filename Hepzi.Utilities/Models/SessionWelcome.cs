using Hepzi.Utilities.Interfaces;

namespace Hepzi.Utilities.Models
{
    public class SessionWelcome
    {
        private ISessionAction? _actions;


        public SessionWelcome(byte[] message, ISession session, object token, ISessionAction actions)
        {
            Message = message;
            Session = session;
            Token = token;
            _actions = actions;
        }


        public byte[] Message { get; }
        public ISession Session { get; }
        public object Token { get; }


        public ISessionAction GetActions()
        {
            var actions = _actions;

            _actions = null;

            if (actions == null)
            {
                throw new InvalidOperationException("Actions already acquired");
            }

            return actions;
        }
    }
}
