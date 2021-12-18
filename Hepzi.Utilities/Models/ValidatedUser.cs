using Hepzi.Utilities.Models;

namespace Hepzi.Application.Models
{
    public class ValidatedUser<TUser>
        where TUser : UserIdentity
    {
        private readonly CancellationTokenSource _cancellation;


        public ValidatedUser(TUser user, string session, CancellationTokenSource cancellation)
        {
            _cancellation = cancellation;
            Session = session;
            User = user;
        }

        public CancellationToken Cancellation => _cancellation.Token;
        public string Session { get; }
        public TUser User { get; }


        public void Cancel() => _cancellation.Cancel();
    }
}
