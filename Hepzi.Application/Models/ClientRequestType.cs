namespace Hepzi.Application.Models
{
    public enum ClientRequestType : byte
    {
        /// <summary>
        /// Default when uninitialised.
        /// </summary>
        Unknown = 0x0,

        /// <summary>
        /// Instance-wide broadcast message
        /// </summary>
        InstanceMessage = 0x1,

        /// <summary>
        /// Terminate a client in the current instance.
        /// </summary>
        KickClient = 0x2
    }
}
