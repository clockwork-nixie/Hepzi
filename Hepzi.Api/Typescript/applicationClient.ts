﻿/// <reference path="arrayBufferWrapper.ts" />
/// <reference path="clientCommandInterpreter.ts" />
/// <reference path="clientResponseParser.ts" />
/// <reference path="eventEmitter.ts" />
/// <reference path="guiClient.ts" />

namespace Hepzi {
    export type ApplicationClientEventName = 'close' | 'kicked' | 'message';

    export interface IApplicationClientOptions {
        isDebug?: boolean;
        isDebugGui?: boolean;
    }


    export class ApplicationClient extends EventEmitter<ApplicationClientEventName, any> {
        private _avatar: Avatar | null = null;
        private readonly _avatars: AvatarLookup;
        private _commandInterpreter: ClientCommandInterpreter;
        private _isDebug: boolean;
        private _gui: GuiClient;
        private _responseParser: ClientResponseParser;
        private _socket: WebSocketClient;
        private _userId: number;
    

        constructor(factory: IFactory, userId: number) {
            super()

            this._avatars = {};
            this._commandInterpreter = new ClientCommandInterpreter();
            this._gui = factory.createGuiClient('canvas');
            this._isDebug = factory.isDebug('ApplicationClient');
            this._responseParser = new ClientResponseParser();
            this._socket = factory.createWebSocketClient();
            this._userId = userId;

            const self = this;

            this._socket.on('open', () => self.onConnecting());
            this._socket.on('close', () => { self.onClose(); self.emit('close', self); });
            this._socket.on('error', () => { self.onClose(); self.emit('error', self); });
            this._socket.on('message', (event: Event) => self.onClientMessageReceived(event));
        }


        public connect(sessionId: number): void {
            if (this._isDebug) {
                console.log('CONNECTING');
            }

            this._socket.connect(this._userId, sessionId);
        }


        public disconnect(): void {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient disconnecting if connected.`);
            }
            this._socket.disconnect();

            if (this._gui) {
                const gui = this._gui;

                gui.stopRun();
            }
        }


        public interpretCommand(command: string): void {
            if (command) {
                const result = this._commandInterpreter.interpretCommand(this._userId, command, this._avatars);

                if (result.log && this._isDebug) {
                    console.log(result.log);
                }

                if (result.message && (this._isDebug || (result.category !== ClientCategory.Debug && result.category !== ClientCategory.Error))) {
                    ((typeof result.message === 'string' || result.message instanceof String) ? [result.message]: result.message)
                        .forEach(message => this.emit('message', {
                            text: message,
                            colour: result.category == ClientCategory.Error ? 'text-danger' : 'text-secondary'
                        }));
                }

                if (result.buffer) {
                    this.send(result.buffer);
                }

                if (result.isTerminal) {
                    this.emit('close', null);
                }
            }
        }


        private onClientMessageReceived(event: any) {
            if (event && event.data) {
                const result = this._responseParser.parseResponse(this._userId, event.data, this._avatars);

                if (result.log && this._isDebug) {
                    console.log(result.log);
                }

                if (result.message && (this._isDebug || (
                    result.category !== ClientCategory.Debug &&
                    result.category !== ClientCategory.Error))) {
                    this.emit('message', { text: result.message, colour: result.determineTextColourClass() });
                }

                if (result.category !== ClientCategory.Error) {
                    if (result.avatar != null) {
                        switch (result.responseType) {
                            case ClientResponseType.AddInstanceSession:
                            case ClientResponseType.InitialInstanceSession:
                                if (this._avatar) {
                                    this._gui.addAvatar(result.avatar);
                                } else if (result.avatar.isSelf) {
                                    this._gui.createScene();

                                    for (const key in this._avatars) {
                                        const avatar = this._avatars[parseInt(key)];
                                        this._gui.addAvatar(avatar);
                                    }

                                    this._gui.startRun();
                                }
                                break;

                            case ClientResponseType.RemoveInstanceSession:
                                this._gui.removeAvatar(result.avatar);
                                break;
                        }
                    }
                }

                if (result.isTerminal) {
                    const self = this;

                    this.disconnect();
                    window.setTimeout(() => self.emit('kicked', null), 2500);
                }
            }
        }


        private onClose() {
            if (this._isDebug) {
                console.log('CLOSING');
            }
        }


        private onConnecting() {
            if (this._isDebug) {
                console.log('CONNECTED');
            }
            Object.keys(this._avatars).forEach(userId => delete this._avatars[parseInt(userId)]);
        }


        public send(buffer: ArrayBuffer) {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient sending array-buffer of size ${new ArrayBufferWrapper(buffer).length}`);
            }

            this._socket.send(buffer);
        }
    }
}