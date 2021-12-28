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


        public int X { get; set; }
        public int Y { get; set; }
        public int Z { get; set; }
    }
}
