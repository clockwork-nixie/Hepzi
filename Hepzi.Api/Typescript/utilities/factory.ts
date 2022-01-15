/// <reference path="../comms/clientResponseParser.ts" />
/// <reference path="../comms/webSocketClient.ts" />
/// <reference path="../gui/avatar.ts" />
/// <reference path="../gui/inputHandler.ts" />
/// <reference path="../gui/sceneManager.ts" />
/// <reference path="./applicationClient.ts" />
/// <reference path="./applicationContext.ts" />
/// <reference path="./configuration.ts" />

namespace Hepzi {
    export interface IFactory {
        createApplicationClient(userId: number): ApplicationClient;
        createApplicationContext(protagonist: Avatar): ApplicationContext;
        createAvatar(): Avatar;
        createInputHandler(): InputHandler;
        createSceneManager(canvasName: string, inputHandler: InputHandler): SceneManager;
        createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient;

        debug(className: string): void;

        getClientResponseParser(): ClientResponseParser;
        getConfiguration(): Readonly<IConfiguration>;

        isDebug(className: string): boolean;
    }


    export class Factory implements IFactory {
        private _clientResponseParser?: ClientResponseParser;
        private _configuration?: Readonly<IConfiguration>;
        private readonly _debugClasses: { [index: string]: boolean } = {};


        public createApplicationClient(userId: number): ApplicationClient { return new ApplicationClient(this, userId); }
        public createApplicationContext(protagonist: Avatar): ApplicationContext { return new ApplicationContext(this, protagonist); }
        public createAvatar(): Avatar { throw new Error("Method not implemented."); }
        public createInputHandler(): InputHandler { return new InputHandler(this); }
        public createSceneManager(canvasName: string, inputHandler: InputHandler): SceneManager { return new SceneManager(this, canvasName, inputHandler); }
        public createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient { return new WebSocketClient({ ...options, isDebug: this.isDebug('WebSocketClient') || options?.isDebug }); }

        public debug(className: string): void { this._debugClasses[className] = true; }

        public getClientResponseParser(): ClientResponseParser { return this._clientResponseParser ?? (this._clientResponseParser = new ClientResponseParser(this)); }
        public getConfiguration(): Readonly<IConfiguration> { return this._configuration ?? (this._configuration = new Configuration()); }

        public isDebug(className: string): boolean { return !!this._debugClasses[className]; }

        public static readonly instance: IFactory = new Factory();
    }
}