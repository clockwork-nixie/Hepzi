namespace Hepzi {
    export class ClientCommandBuilder {
        public static MoveClient(avatar: Avatar): ArrayBuffer {
            const buffer = new ArrayBuffer(25);
            const writer = new Hepzi.ArrayBufferWrapper(buffer);

            writer.putByte(ClientRequestType.MoveClient);
            writer.putVector3d(avatar.position);
            writer.putVector3d(avatar.direction);

            return buffer;
        }
    }
}