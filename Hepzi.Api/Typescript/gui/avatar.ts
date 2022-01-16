/// <reference path="../gui/mobile.ts"/>

namespace Hepzi {
    export class Avatar extends Mobile {
        private readonly _lastDirection: BABYLON.Vector3;
        private readonly _lastPosition: BABYLON.Vector3;


        constructor(username: string, isProtagonist: boolean, userId: number, position: BABYLON.Vector3, direction: BABYLON.Vector3) {
            super(username);

            this.isProtagonist = isProtagonist;
            this.userId = userId;

            this.direction.copyFrom(direction);
            this.position.copyFrom(position);
            this._lastDirection = new BABYLON.Vector3();
            this._lastPosition = new BABYLON.Vector3();

            this.updateLastPositionAndDirection();
        }


        public readonly isProtagonist: boolean;
        public readonly userId: number;


        public hasPositionOrDirectionChanged() {
            return !(this._lastDirection.equals(this.direction) && this._lastPosition.equals(this.position));
        }


        public setMeshRotationFromDirection() {
            const mesh = this.mesh;

            if (mesh) {
                const direction = this.direction;

                // If all directions are zero there's no way to normalise to a unit-vector,
                // so arbitrarily choose the positive x-axis as the direction.
                if (direction.x || direction.y || direction.z) {
                    this.direction.normalize(); // in-place update
                } else {
                    this.direction.x = 1;
                }

                if (this.isDebug) {
                    console.debug(`Avatar #${this.userId} before rotation is: ${mesh.rotationQuaternion}`)
                }

                const rotationQuaternion = BABYLON.Quaternion.FromEulerVector(this.direction);

                mesh.rotationQuaternion = rotationQuaternion;

                if (this.isDebug) {
                    console.debug(`Avatar #${this.userId} after rotation is: ${mesh.rotationQuaternion}`)
                }
            }
        }


        public updateLastPositionAndDirection() {
            this._lastDirection.copyFrom(this.direction);
            this._lastPosition.copyFrom(this.position);
        }
    }

    export type AvatarLookup = { [index: number]: Avatar };
}