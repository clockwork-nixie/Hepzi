/// <reference path="utilities/eventEmitter.ts" />

namespace Hepzi {
    export type ApplicationClientEventName = 'close' | 'console' | 'error' | 'message';


    export class ApplicationClient extends EventEmitter<ApplicationClientEventName, any> {
        private _avatar: Avatar | null = null;
        private readonly _avatars: AvatarLookup;
        private _isDebug: boolean;
        private _gui: GuiClient;
        private _responseParser: ClientResponseParser;
        private _socket: WebSocketClient;
        private _updateTimerHandle: number | null = null;
        private readonly _userId: number;
            

        constructor(factory: IFactory, userId: number) {
            super()

            this._avatars = {};
            this._userId = userId;

            this._gui = factory.createGuiClient('canvas');
            this._isDebug = factory.isDebug('ApplicationClient');
            this._responseParser = factory.createClientResponseParser();
            this._socket = factory.createWebSocketClient();

            const self = this;

            this._socket.on('open', () => self.onConnecting());
            this._socket.on('close', () => self.emit('close', self));
            this._socket.on('error', () => self.emit('error', self));
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
            this._avatar = null;
            this._socket.disconnect();
            
            if (this._gui) {
                this._gui.stopRun();
            }
        }


        public interpretCommand(command: string): void {
            if (command) {
                const result = ClientCommandInterpreter.interpretCommand(this._userId, command, this._avatars);

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

                                    if (this._updateTimerHandle) {
                                        window.clearInterval(this._updateTimerHandle);
                                        this._updateTimerHandle = null;
                                    }
                                    const self = this;

                                    this._avatar = result.avatar;
                                    this._updateTimerHandle = window.setInterval(() => self.onUpdateTimer(), 10);
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
                    window.setTimeout(() => self.emit('close', null), 2500);
                }
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
                console.log(`SEND array-buffer of size ${buffer.byteLength}`);
            }
            this._socket.send(buffer);
        }


        private onUpdateTimer() {
            if (this._socket && this._avatar) {
                if (this._avatar.hasPositionOrDirectionChanged()) {
                    this._avatar.updateLastPositionAndDirection();
                    this.send(ClientCommandBuilder.MoveClient(this._avatar));
                }
            }
        }
    }
}