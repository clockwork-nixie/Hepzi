using Hepzi.Application.Helpers;
using Hepzi.Application.Interfaces;
using Hepzi.Application.Models;
using Hepzi.Application.Sessions;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using Hepzi.Utilities.Models;
using System.Collections.Concurrent;
using System.Text;

namespace Hepzi.Application.Servers
{
    public class ZoneInstance : IZoneInstance
    {
        private static readonly NLog.Logger Logger = NLog.LogManager.GetCurrentClassLogger();
        private readonly SessionActions _actions;
        private readonly object _instanceSessionLock = new();
        private readonly Random _random = new();
        private readonly ConcurrentDictionary<int, Session<ZoneSessionState>> _roster = new();
        private readonly Vector3d _spawnPoint = new();


        public ZoneInstance()
        {
            _actions = new(() => _roster.Values);
            _actions.StartWorker();
        }


        public SessionWelcome? AddSession(Session<ZoneSessionState> session, object token)
        {
            ISessionAction actions;

            var state = session.State;
            
            state.Position = _spawnPoint + new Vector3d(_random.Next(200) - 100, _random.Next(100), _random.Next(200) - 100);
            state.Direction = _spawnPoint.IsZero? new(1, 0 , 0): -_spawnPoint;

            state.Direction.Normalise(100);

            lock (_instanceSessionLock)
            {
                if (_roster.TryRemove(session.UserId, out var existing) && existing != null)
                {
                    Terminate(existing);
                }
                var currentAction = _actions.Current;
                var sessions = _roster.Values.ToArray();
               
                // This places the "add" action at the head of the chain which makes it the first
                // action that will be actions by the new user: but we exclude it from that user :)
                _actions.AddAction(session.AddInstanceSession(), excludeUserId: session.UserId);
                actions = InitialSessionAction.BuildInitialActionChain(session, sessions, currentAction);

                _roster[session.UserId] = session;
            }

            return new SessionWelcome(
                new byte[] { (byte)ClientResponseType.Welcome },
                session,
                token,
                actions);
        }


        public TimeSpan ConnectionTimeout => TimeSpan.FromSeconds(20); // TODO: settings


        public void Dispose() => _actions.Dispose();


        public bool ProcessClientRequest(Session<ZoneSessionState> session, ArraySegment<byte> data, object token)
        {
            var result = false;
            ClientRequestType? command = null;

            try
            {
                if (session.HasToken(token))
                {
                    if (data.Count == 0)
                    {
                        _actions.AddAction(session.Heartbeat(), session.UserId);
                    }
                    else
                    {
                        var buffer = new BufferWrapper(data);
                        
                        command = (ClientRequestType)buffer.Read();

                        switch (command)
                        {
                            case ClientRequestType.InstanceMessage:
                                _actions.AddAction(session.InstanceMessage(Encoding.UTF8.GetString(data.Skip(1).ToArray())));
                                break;

                            case ClientRequestType.KickClient:
                                _actions.AddAction(session.KickClient(), buffer.ReadInt(), true);
                                break;

                            case ClientRequestType.MoveClient:
                                var position = buffer.ReadVector3d();
                                var direction = buffer.ReadVector3d();

                                session.State.Position = position;
                                session.State.Direction = direction;

                                _actions.AddAction(session.MoveClient(), excludeUserId: session.UserId);
                                break;

                            default:
                                break;
                        }
                    }
                    result = true;
                }
            }
            catch (Exception exception)
            {
                Logger.Error(exception, $"In {nameof(ProcessClientRequest)} processing '{command}' ({data.Count} bytes) for user #{session?.UserId}");
            }

            return result;
        }


        public void RemoveSession(ISession session, object token)
        {
            lock (_instanceSessionLock)
            {
                if (_roster.TryGetValue(session.UserId, out var existing) && existing != null && existing.HasToken(token))
                {
                    _roster.Remove(session.UserId, out _);
                    Terminate(existing);
                }
            }
        }


        private void Terminate(Session<ZoneSessionState> session) => _actions.AddAction(session.RemoveInstanceSession(), excludeUserId: session.UserId);
    }
}
