/// <reference path="../external/babylon.module.d.ts"/>

namespace Hepzi {
    export class Mobile {
        constructor(name: string) {
            this.direction = new BABYLON.Vector3();
            this.mesh = null;
            this.name = name;
            this.position = new BABYLON.Vector3();
        }


        public readonly direction: BABYLON.Vector3;
        public isDebug: boolean = false;
        public mesh: BABYLON.Mesh | null;
        public readonly name: string;
        public readonly position: BABYLON.Vector3;


        public setMeshRotationFromDirection() {
            const mesh = this.mesh;

            if (mesh) {
                const direction = this.direction;

                // If all directions are zero there's no way to normalise to a unit-vector,
                // so arbitrarily choose the positive x-axis as the direction.
                if (direction.x || direction.y || direction.z) {
                    this.direction.normalize();
                } else {
                    this.direction.x = 1;
                }

                const rotationQuaternion = BABYLON.Quaternion.FromEulerVector(this.direction);

                mesh.rotationQuaternion = rotationQuaternion;
            }
        }
    }
}