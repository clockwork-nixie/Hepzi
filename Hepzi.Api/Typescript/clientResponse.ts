namespace Hepzi {
    export class ClientResponse {
        public avatar?: Avatar;
        public category: ClientCategory;
        public isTerminal?: boolean = false;
        public log?: string;
        public message?: string;
        public readonly responseType: ClientResponseType;
        public userId?: number;
        

        constructor(responseType: ClientResponseType) {
            this.responseType = responseType;
            this.category = ClientCategory.Normal;
        }


        public determineTextColourClass(): string {
            let colour;

            switch (this.category) {
                case ClientCategory.Debug:
                    colour = 'text-secondary';
                    break;

                case ClientCategory.Error:
                case ClientCategory.System:
                    colour = 'text-danger';
                    break;

                case ClientCategory.Important:
                    colour = 'text-primary';
                    break;

                default:
                    colour = 'text-success';
                    break;
            }

            return colour;
        }
    }
}