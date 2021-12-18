using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using Hepzi.Utilities.Models;
using System.Collections.Concurrent;

namespace Hepzi.Application.Servers
{
    public class MemoryUserRepository : IUserRepository
    {
        private readonly ConcurrentDictionary<int, UserIdentity> _usersById = new ConcurrentDictionary<int, UserIdentity>();
        private readonly ConcurrentDictionary<string, User> _usersByName = new ConcurrentDictionary<string, User>(StringComparer.InvariantCultureIgnoreCase);
        private int _userId = 1;


        public MemoryUserRepository()
        {
            Add("Nikki", "nikki");
            Add("Eek", "ook");
        }


        private void Add(string username, string password)
        {
            var user = new User(username, password, Interlocked.Increment(ref _userId));
            var identity = new UserIdentity(user.Username, user.UserId);

            _usersById[user.UserId] = identity;
            _usersByName[username] = user;
        }


        public UserIdentity? GetUserByUserId(int userId) => _usersById.TryGetValue(userId, out var user) ? user : null;
        public User? GetUserByUsername(string username) => _usersByName.TryGetValue(username, out var user) ? user : null;
    }
}
