namespace Hepzi {
    export class Avatar {
        constructor(username: string, userId: number) {
            this.name = username;
            this.userId = userId;
        }

        public readonly name: string;
        public readonly userId: number;
    }

    export type AvatarLookup = { [index: number]: Avatar };
}