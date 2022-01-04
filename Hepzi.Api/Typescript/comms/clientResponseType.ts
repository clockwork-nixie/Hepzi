namespace Hepzi {
    export enum ClientResponseType {
        /// <summary>
        /// Default when uninitialised; to not send.
        /// </summary>
        Unknown = 0x0,

        /// <summary>
        /// Sent as first message when session established with instance.
        /// </summary>
        Welcome = 0x1,

        /// <summary>
        /// Sent as a keepalive when there's nothing else to send.
        /// </summary>
        Heartbeat = 0x2,

        /// <summary>
        /// Add session to instance without greeting.
        /// </summary>
        InitialInstanceSession = 0x3,

        /// <summary>
        /// Add session to instance with greeting.
        /// </summary>
        AddInstanceSession = 0x4,

        /// <summary>
        /// Remove user from instance user-list.
        /// </summary>
        RemoveInstanceSession = 0x5,

        /// <summary>
        /// Broadcast an instance-wide message.
        /// </summary>
        InstanceMessage = 0x6,

        /// <summary>
        /// Terminate the client.
        /// </summary>
        KickClient = 0x7,

        /// <summary>
        /// Update client position and direction
        /// </summary>
        MoveClient = 0x8
    }
}