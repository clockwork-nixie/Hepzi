namespace Hepzi {
    export interface IConfiguration {
        consoleLines: number;
        consoleScrollDelayMilliseconds: number;
    }

    export class Configuration implements IConfiguration {
        public consoleLines: number = 100;
        public consoleScrollDelayMilliseconds: number = 10;
    }
}