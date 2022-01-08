/// <reference path="../gui/avatar.ts" />
/// <reference path="../utilities/arrayBufferWrapper.ts" />
/// <reference path="clientRequestType.ts" />

namespace Hepzi {
    export class ClientCommandBuilder {
        public static KickUser(userId: number): ArrayBuffer {
            const buffer = new ArrayBuffer(5);
            const writer = new ArrayBufferWrapper(buffer);

            writer.putByte(ClientRequestType.KickClient);
            writer.putInteger(userId);

            return buffer;
        }


        public static MoveClient(avatar: Avatar): ArrayBuffer {
            const buffer = new ArrayBuffer(25);
            const writer = new Hepzi.ArrayBufferWrapper(buffer);

            writer.putByte(ClientRequestType.MoveClient);
            writer.putVector3d(avatar.position, 100);
            writer.putVector3d(avatar.direction, 100);

            return buffer;
        }
    }
}