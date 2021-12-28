using Hepzi.Utilities.Models;

namespace Hepzi.Utilities.Helpers
{
    public struct BufferWrapper
    {
        private ArraySegment<byte> _buffer;
        private int _position = 0;

        public BufferWrapper(ArraySegment<byte> buffer) => _buffer = buffer;
        public BufferWrapper(byte[] buffer) : this(new ArraySegment<byte>(buffer)) { }
        public BufferWrapper(byte[] buffer, int count) : this(new ArraySegment<byte>(buffer, 0, count)) { }


        public int Position => _position;
        public byte Read() => _buffer[_position++];
        

        public int ReadInt()
        {
            var value = 0;

            for (int i = 0; i < sizeof(int); i++)
            {
                value = (value << 8) + Read();
            }

            return value;
        }


        public BufferWrapper Skip(int count = 1)
        {
            _position += count;
            return this;
        }


        public BufferWrapper SkipInt(int count = 1) => Skip(sizeof(int) * count);


        public byte Write(byte value) => _buffer[_position++] = value;


        public int WriteInt(int value)
        {
            for (int i = sizeof(int) - 1; i >= 0; --i)
            {
                Write((byte)(value >> (8 * i)));
            }

            return value;
        }


        public void WriteVector3d(Vector3d vector)
        {
            WriteInt(vector.X);
            WriteInt(vector.Y);
            WriteInt(vector.Z);
        }
    }
}
