using Hepzi.Application.Models;
using Hepzi.Utilities.Helpers;
using Hepzi.Utilities.Interfaces;
using System.Text;

namespace Hepzi.Application.Helpers
{
    public static class SessionMessageHelpers
    {
        public static byte[] AddInstanceSession(this ISession session)
        {
            var buffer = new byte[1 + sizeof(int) + Encoding.UTF8.GetByteCount(session.Username)];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)ClientResponseType.AddInstanceSession);
            writer.WriteInt(session.UserId);
            Encoding.UTF8.GetBytes(session.Username, 0, session.Username.Length, buffer, writer.Position);

            return buffer;
        }


        public static byte[] Heartbeat(this ISession _) => new byte[] { (byte)ClientResponseType.Heartbeat };


        public static byte[] InitialInstanceSession(this ISession session)
        {
            var buffer = new byte[1 + sizeof(int) + Encoding.UTF8.GetByteCount(session.Username)];
            var writer = new BufferWrapper(buffer);

            writer.Write((byte)ClientResponseType.InitialInstanceSession);
            writer.WriteInt(session.UserId);
            Encoding.UTF8.GetBytes(session.Username, 0, session.Username.Length, buffer, writer.Position);

            return buffer;
        }


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
