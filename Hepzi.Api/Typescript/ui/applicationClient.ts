/// <reference path="../comms/clientCommandInterpreter.ts" />
/// <reference path="../utilities/eventEmitter.ts" />

namespace Hepzi {
    export type ApplicationClientEventName = 'close' | 'connected' | 'console' | 'error' | 'message' | 'target';


    export class ConsoleEntry {
        constructor(text: string, colour?: string) {
            this.text = text;
            this.colour = colour;
        }

        public readonly text: string;
        public readonly colour?: string;
    }


    export class ApplicationClient extends EventEmitter<ApplicationClientEventName, any> {
        private _context: ApplicationContext | null = null;
        private _isDebug: boolean;
        private readonly _factory: IFactory;
        private _gui: SceneManager;
        private _responseParser: ClientResponseParser;
        private readonly _socket: WebSocketClient;
        private _updateTimerHandle: number | null = null;
        private readonly _userId: number;
            

        constructor(factory: IFactory, userId: number) {
            super()

            this._factory = factory;
            this._userId = userId;

            const inputHandler = factory.createInputHandler();

            this._gui = factory.createSceneManager('canvas', inputHandler);
            this._isDebug = factory.isDebug('ApplicationClient');
            this._responseParser = factory.getClientResponseParser();
            this._socket = factory.createWebSocketClient();

            const self = this;

            inputHandler.on('console', () => self.emit('console', self));
            inputHandler.on('escape', this.onEscape.bind(self));
            inputHandler.on('target', this.setTarget.bind(self));

            this._socket.on('open', () => self.emit('connected', self));
            this._socket.on('close', () => self.emit('close', self));
            this._socket.on('error', () => self.emit('error', self));
            this._socket.on('message', (event: Event) => self.onClientMessageReceived(event as MessageEvent));
        }


        private clearTarget(): void {
            if (this._context?.target) {
                this._context.target = null;
                this.emit('target', null);
            }
        }


        public connect(sessionId: number): void {
            if (this._isDebug) {
                console.debug('CONNECTING');
            }

            this._socket.connect(this._userId, sessionId);
        }


        public disconnect(): void {
            if (this._isDebug) {
                console.debug(`DEBUG: ApplicationClient disconnecting if connected.`);
            }
            this.stopUpdateTimer();
            this._context = null;
            this._socket.disconnect();
            this._gui.stopRun();
        }


        public interpretCommand(command: string): void {
            if (command && this._context) {
                const result = ClientCommandInterpreter.interpretCommand(command, this._context);

                if (result.log && this._isDebug) {
                    console.debug(result.log);
                }

                if (result.message && (this._isDebug || (result.category !== ClientCategory.Debug && result.category !== ClientCategory.Error))) {
                    ((typeof result.message === 'string' || result.message instanceof String) ? [result.message]: result.message)
                        .forEach(message => this.emit('message', new ConsoleEntry(message as string,
                            result.category == ClientCategory.Error ? 'text-danger' : 'text-secondary')));
                }

                if (result.buffer) {
                    this.send(result.buffer);
                }

                if (result.isTerminal) {
                    this.emit('close', null);
                }
            }
        }


        private onClientMessageReceived(event: MessageEvent) {
            if (event && event.data) {
                const result = this._responseParser.parseResponse(this._userId, event.data, this._context);

                if (result.log && this._isDebug) {
                    console.debug(result.log);
                }

                if (result.message && (this._isDebug || (
                    result.category !== ClientCategory.Debug &&
                    result.category !== ClientCategory.Error))) {
                    this.emit('message', new ConsoleEntry(result.message, result.determineTextColourClass()));
                }

                if (result.category !== ClientCategory.Error) {
                    if (result.avatar) {
                        switch (result.responseType) {
                            case ClientResponseType.AddInstanceSession:
                            case ClientResponseType.InitialInstanceSession:
                                if (this._context) {
                                    this._gui.addMobile(result.avatar);
                                } else if (result.avatar.isProtagonist) {
                                    this._context = this._factory.createApplicationContext(result.avatar);
                                    this._gui.createScene(this._context);
                                    this._gui.startRun();
                                    this.startUpdateTimer();
                                }
                                break;

                            case ClientResponseType.RemoveInstanceSession:
                                if (result.avatar.userId != this._userId) {
                                    this._gui.removeMobile(result.avatar);
                                }
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


        private onEscape(): void {
            if (this._context?.target) {
                this.clearTarget();
            }
        }


        private onUpdateTimer(): void {
            if (this._context?.protagonist.hasPositionOrDirectionChanged()) {
                this._context.protagonist.updateLastPositionAndDirection();
                this.send(ClientCommandBuilder.MoveClient(this._context.protagonist));
            }
        }


        private send(buffer: ArrayBuffer) {
            if (this._isDebug) {
                console.debug(`SEND array-buffer of size ${buffer.byteLength}`);
            }

            this._socket.send(buffer);
        }


        private setTarget(event: IInputEvent): void {
            if (event.mobile && this._context && this._context.target !== event.mobile) {
                this._context.target = event.mobile;
                this.emit('target', this._context.target);
            }
        }


        private startUpdateTimer(): void {
            this.stopUpdateTimer();
            this._updateTimerHandle = window.setInterval(this.onUpdateTimer.bind(this), 10);
        }


        private stopUpdateTimer(): void {
            if (this._updateTimerHandle) {
                window.clearInterval(this._updateTimerHandle);
                this._updateTimerHandle = null;
            }
        }
    }
}