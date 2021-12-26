using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using System.Collections.Concurrent;

namespace Hepzi.Application.Servers
{
    public class MemoryUserRepository : IUserRepository
    {
        private readonly ConcurrentDictionary<string, User> _usersByName = new(StringComparer.InvariantCultureIgnoreCase);
        private int _lastUserId = 0;


        public MemoryUserRepository()
        {
            Add("Nikki", "nikki");
            Add("Eek", "ook");
        }


        private void Add(string username, string password) =>
            _usersByName[username] = new User { Username = username, UserId = Interlocked.Increment(ref _lastUserId), Password = password };
        

        public User? GetUserByUsername(string username) => _usersByName.TryGetValue(username, out var user) ? user : null;
    }
}
