namespace Hepzi {
    export class ClientContext {
        private readonly _avatars: AvatarLookup;
        private readonly _socket: WebSocketClient;
        private readonly _userId: number;

        constructor(userId: number, socket: WebSocketClient) {
            this._avatars = {};
            this._socket = socket;
            this._userId = userId;
        }
    }
}