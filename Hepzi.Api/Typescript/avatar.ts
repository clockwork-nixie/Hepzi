namespace Hepzi {
    export class Avatar {
        private readonly _lastDirection: BABYLON.Vector3;
        private readonly _lastPosition: BABYLON.Vector3;

        constructor(username: string, isSelf: boolean, userId: number, position: BABYLON.Vector3, direction: BABYLON.Vector3) {
            this.direction = direction;
            this.isSelf = isSelf;
            this.name = username;
            this.mesh = null;
            this.position = position;
            this.userId = userId;

            this._lastDirection = new BABYLON.Vector3();
            this._lastPosition = new BABYLON.Vector3();
        }

        public readonly isSelf: boolean;
        public mesh: BABYLON.Mesh | null;
        public readonly name: string;
        direction: BABYLON.Vector3;
        position: BABYLON.Vector3;
        public readonly userId: number;


        public hasPositionOrDirectionChanged() {
            return !(this._lastDirection.equals(this.direction) && this._lastPosition.equals(this.position));
        }


        public updateLastPositionAndDirection() {
            this._lastDirection.copyFrom(this.direction);
            this._lastPosition.copyFrom(this.position);
        }
    }

    export type AvatarLookup = { [index: number]: Avatar };
}