namespace Hepzi.Utilities.Helpers
{
    public static class CharacterHelpers
    {
        public static bool IsHexadecimal(this char character) => ('0' <= character && character <= '9') || ('A' <= character && character <= 'F') || ('a' <= character && character <= 'f');
    }
}
