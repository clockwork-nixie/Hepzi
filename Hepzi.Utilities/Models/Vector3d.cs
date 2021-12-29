namespace Hepzi.Utilities.Models
{
    public class Vector3d
    {
        public Vector3d() { }

        public Vector3d(int x, int y, int z = 0) {
            X = x;
            Y = y;
            Z = z;
        }


        public static Vector3d operator + (Vector3d first, Vector3d second) => new(first.X + second.X, first.Y + second.Y, first.Z + second.Z);
        public static Vector3d operator - (Vector3d first, Vector3d second) => new(first.X - second.X, first.Y - second.Y, first.Z - second.Z);
        public static Vector3d operator -(Vector3d vector) => new(-vector.X, -vector.Y, -vector.Z);


        public bool IsZero => X == 0 && Y == 0 && Z == 0;
        public int X { get; set; }
        public int Y { get; set; }
        public int Z { get; set; }


        public void Normalise(double scale = 1)
        {
            var modulus = Math.Sqrt(X * X + Y * Y + Z * Z);

            X = (int)(scale * X / modulus);
            Y = (int)(scale * Y / modulus);
            Z = (int)(scale * Z / modulus);
        }


        public void Zero() => X = Y = Z = 0;
    }
}
