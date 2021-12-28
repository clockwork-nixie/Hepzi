using Hepzi.Application.Models;
using Hepzi.Application.Sessions;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using System.Text;

namespace Hepzi.Application.Helpers
{
    public static class SessionMessageHelpers
    {
        private static byte[] CreateNewSessionMessage(this Session<ZoneSessionState> session, ClientResponseType type)
        {
            var buffer = new byte[1 + sizeof(int) * 7 + Encoding.UTF8.GetByteCount(session.Username)];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)type);
            writer.WriteInt(session.UserId);
            writer.WriteVector3d(session.State.Position);
            writer.WriteVector3d(session.State.Direction);
            Encoding.UTF8.GetBytes(session.Username, 0, session.Username.Length, buffer, writer.Position);

            return buffer;
        }


        public static byte[] AddInstanceSession(this Session<ZoneSessionState> session) =>
            session.CreateNewSessionMessage(ClientResponseType.AddInstanceSession);


        public static byte[] Heartbeat(this ISession _) => new byte[] { (byte)ClientResponseType.Heartbeat };


        public static byte[] InitialInstanceSession(this Session<ZoneSessionState> session) =>
            session.CreateNewSessionMessage(ClientResponseType.InitialInstanceSession);


        public static byte[] RemoveInstanceSession(this ISession session)
        {
            var buffer = new byte[1 + sizeof(int)];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)ClientResponseType.RemoveInstanceSession);
            writer.WriteInt(session.UserId);

            return buffer;
        }


        public static byte[] InstanceMessage(this ISession _, string message)
        {
            var buffer = new byte[1 + Encoding.UTF8.GetByteCount(message)];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)ClientResponseType.InstanceMessage);
            Encoding.UTF8.GetBytes(message, 0, message.Length, buffer, writer.Position);

            return buffer;
        }


        public static byte[] KickClient(this ISession _)
        {
            var buffer = new byte[1];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)ClientResponseType.KickClient);

            return buffer;
        }
    }
}
