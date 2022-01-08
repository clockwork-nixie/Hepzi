/// <reference path="../utilities/arrayBufferWrapper.ts" />
/// <reference path="../utilities/eventEmitter.ts" />

namespace Hepzi {
    export type WebSocketEventName = 'close' | 'error' | 'open' | 'message';

    export interface IWebSocketClient {
        connect: (userId: number, sessionId: number) => void;
        disconnect: () => void;
        on(eventName: WebSocketEventName, callback: (event: Event) => void): void;
        off(eventName: WebSocketEventName, callback: (event: Event) => void): void;
        send: (message: ArrayBuffer | Blob | string) => boolean;
    }

    export interface IWebSocketClientOptions {
        address?: string;
        binaryType?: BinaryType;
        isDebug?: boolean;
        path?: string;
    }


    export class WebSocketClient extends EventEmitter<WebSocketEventName, Event> implements IWebSocketClient {
        private _address: string;
        private _binaryType: BinaryType;
        private _isDebug: boolean;
        private _path: string;
        private _socket: WebSocket | null;
        private _sessionId: number | null;
        private _userId: number | null;


        constructor(options: IWebSocketClientOptions) {
            options = options || {};

            super();

            this._address = options.address || `${window.location.hostname}:${window.location.port}`;
            this._binaryType = options.binaryType || 'arraybuffer';
            this._isDebug = !!(options.isDebug);
            this._path = ((options.path === undefined || options.path === null) ? 'client' : options.path).replace(/^\//, '');
            this._socket = null;
            this._sessionId = null;
            this._userId = null;
        }


        public connect(userId: number, sessionId: number): void {
            if (this._socket) {
                throw Error('Connect attempted while socket already connected.');
            }

            if (!userId || !sessionId) {
                throw Error('Both userId and sessionId must be supplied for connect().');
            }

            const socketUrl = `wss://${this._address}/${this._path}`;
            const socket = new WebSocket(socketUrl);
            const self = this;

            if (this._binaryType) {
                socket.binaryType = this._binaryType;
            }

            socket.onclose = (event: Event) => self.emitExtended('close', event, socket, self.disconnect.bind(this));
            socket.onerror = (event: Event) => self.emitExtended('error', event, socket, self.disconnect.bind(this));
            socket.onmessage = (event: Event) => self.emitExtended('message', event, socket); 
            socket.onopen = (event: Event) => self.emitExtended('open', event, socket, self.onOpen.bind(this));

            this._socket = socket;
            this._sessionId = sessionId;
            this._userId = userId;
        }


        public disconnect(): void {
            const socket = this._socket;

            this._socket = null;

            if (socket) {
                if (this._isDebug) {
                    console.debug('Disconnect of web-socket requested by local application.');
                }
                socket.close();
            } else if (this._isDebug) {
                console.debug('Disconnect of non-open web-socket requested by local application: ignored.');
            }
        }


        private emitExtended(eventName: WebSocketEventName, event: Event, socket: WebSocket, callback?: () => void) {
            if (socket && socket === this._socket) {
                if (this._isDebug && callback) {
                    console.debug(`"${eventName}" event raised for current web-socket: running direct callback.`);
                }
                callback?.();

                if (this._isDebug) {
                    console.debug(`Emitting "${eventName}" event from socket.`);
                }
                this.emit(eventName, event);
            } else if (this._isDebug) {
                console.debug(`"${eventName}" event raised for non-current web-socket: ignored.`);
            }
        }


        private onOpen() {
            if (!this._sessionId || !this._userId) {
                throw Error(`Invalid state on open`);
            } else {
                if (this._isDebug) {
                    console.debug(`Connecting userId ${this._userId} to session ${this._sessionId}`);
                }
                const buffer = new ArrayBuffer(8);
                const writer = new ArrayBufferWrapper(buffer);

                writer.putInteger(this._userId);
                writer.putInteger(this._sessionId);

                if (this._isDebug) {
                    console.debug(`Received message from client: ${buffer}`);
                }
                this.send(buffer);
            }
        }


        public send(message: ArrayBuffer | Blob | string): boolean {
            let result: boolean = false;

            try {
                if (this._socket) {
                    if (this._isDebug) {
                        console.debug(`Sending [${message}] to connected client.`);
                    }
                    this._socket.send(message);
                    result = true;
                } else if (this._isDebug) {
                    console.debug('Send on non-open socket: ignored.');
                }
            } catch (error: any) {
                console.error(`Error during send on websocket: ${error?.message || error}`)
            }

            return result;
        }
    }
}