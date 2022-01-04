﻿namespace Hepzi {
    export enum ClientRequestType {
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
        KickClient = 0x2,

        /// <summary>
        /// Update client position and direction
        /// </summary>
        MoveClient = 0x3
    }
}