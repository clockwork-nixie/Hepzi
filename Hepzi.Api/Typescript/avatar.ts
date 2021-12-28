namespace Hepzi {
    export class Avatar {
        constructor(username: string, isSelf: boolean, userId: number, position: BABYLON.Vector3, direction: BABYLON.Vector3) {
            this.direction = direction;
            this.isSelf = isSelf;
            this.name = username;
            this.mesh = null;
            this.position = position;
            this.userId = userId;
        }

        public readonly isSelf: boolean;
        public mesh: BABYLON.Mesh | null;
        public readonly name: string;
        direction: BABYLON.Vector3;
        position: BABYLON.Vector3;
        public readonly userId: number;
    }

    export type AvatarLookup = { [index: number]: Avatar };
}