/// <reference path="applicationClient.ts" />
/// <reference path="comms/clientCommandInterpreter.ts" />
/// <reference path="comms/clientResponseParser.ts" />
/// <reference path="comms/webSocketClient.ts" />
/// <reference path="gui/guiClient.ts" />

namespace Hepzi {
    export interface IFactory {
        createApplicationClient(userId: number): ApplicationClient;
        createClientCommandInterpreter(): ClientCommandInterpreter;
        createClientResponseParser(): ClientResponseParser;
        createGuiClient(canvasName: string): GuiClient;
        createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient;

        debug(className: string): void;

        isDebug(className: string): boolean;
    }


    export class Factory implements IFactory {
        private readonly _debugClasses: { [index: string]: boolean } = {};


        public createApplicationClient(userId: number): ApplicationClient { return new ApplicationClient(this, userId); }
        public createClientCommandInterpreter(): ClientCommandInterpreter { return new ClientCommandInterpreter(); }
        public createClientResponseParser(): ClientResponseParser { return new ClientResponseParser(this); }
        public createGuiClient(canvasName: string): GuiClient { return new GuiClient(this, canvasName); }
        public createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient { return new WebSocketClient({ ...options, isDebug: this.isDebug('WebSocketClient') || options?.isDebug }); }


        public debug(className: string): void { this._debugClasses[className] = true; }
        public isDebug(className: string): boolean { return !!this._debugClasses[className]; }

        public static readonly instance: IFactory = new Factory();
    }
}