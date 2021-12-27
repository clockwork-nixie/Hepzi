/// <reference path="applicationClient.ts" />
/// <reference path="guiClient.ts" />
/// <reference path="webSocketClient.ts" />

namespace Hepzi {
    export interface IFactory {
        createApplicationClient(userId: number): ApplicationClient;
        createGuiClient(canvasName: string): GuiClient;
        createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient;

        debug(className: string): void;

        isDebug(className: string): boolean;
    }


    export class Factory implements IFactory {
        private readonly _debugClasses: { [index: string]: boolean } = {};


        public createApplicationClient(userId: number): ApplicationClient { return new ApplicationClient(this, userId); }
        public createGuiClient(canvasName: string): GuiClient { return new GuiClient(this, canvasName); }
        public createWebSocketClient(options?: IWebSocketClientOptions): WebSocketClient { return new WebSocketClient({ ...options, isDebug: this.isDebug('WebSocketClient') || options?.isDebug }); }


        debug(className: string): void { this._debugClasses[className] = true; }

        public isDebug(className: string): boolean { return !!this._debugClasses[className]; }

        public static readonly instance: IFactory = new Factory();
    }
}