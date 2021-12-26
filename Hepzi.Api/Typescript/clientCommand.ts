namespace Hepzi {
    export class ClientCommand {
        constructor(command: ClientRequestType) {
            this.command = command;
        }


        public readonly command: ClientRequestType;
        public buffer?: ArrayBuffer;
        public category: ClientCategory = ClientCategory.Normal;
        public isTerminal: boolean = false;
        public log?: string;
        public message?: string | string[];
    }
}