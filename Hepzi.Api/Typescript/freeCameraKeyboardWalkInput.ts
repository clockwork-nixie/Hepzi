namespace Hepzi {
    export class FreeCameraKeyboardWalkInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
        public angularSpeed: number = 0.1;
        public camera: BABYLON.Nullable<BABYLON.FreeCamera> | null = null;
        public direction: BABYLON.Vector3 = new BABYLON.Vector3();

        private _keys: Array<any> = [];
        public keysUp = [38];
        public keysDown = [40];
        public keysLeft = [37];
        public keysRight = [39];

        private _onKeyDown: ((event: KeyboardEvent) => void) | null = null;
        private _onKeyUp: ((event: KeyboardEvent) => void) | null = null;


        public constructor() {
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
        }


        public attachControl(noPreventDefault?: boolean): void {
            var element = this.camera?.getEngine().getInputElement();
            
            if (element && !this._onKeyDown) {
                var self = this;

                element.tabIndex = 1;

                this._onKeyDown = function (event: KeyboardEvent) {
                    if (self.keysUp.indexOf(event.keyCode) !== -1 ||
                        self.keysDown.indexOf(event.keyCode) !== -1 ||
                        self.keysLeft.indexOf(event.keyCode) !== -1 ||
                        self.keysRight.indexOf(event.keyCode) !== -1) {

                        var index = self._keys.indexOf(event.keyCode);

                        if (index === -1) {
                            self._keys.push(event.keyCode);
                        }

                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
                    }
                };

                this._onKeyUp = function (event) {
                    if (self.keysUp.indexOf(event.keyCode) !== -1 ||
                        self.keysDown.indexOf(event.keyCode) !== -1 ||
                        self.keysLeft.indexOf(event.keyCode) !== -1 ||
                        self.keysRight.indexOf(event.keyCode) !== -1) {

                        var index = self._keys.indexOf(event.keyCode);

                        if (index >= 0) {
                            self._keys.splice(index, 1);
                        }

                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
                    }
                };

                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
            }
        }


        public checkInputs(): void {
            const camera = this.camera;

            if (camera && this._onKeyDown) {
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    var speed = camera.speed;

                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera.rotation.y -= this.angularSpeed;
                        this.direction.copyFromFloats(0, 0, 0);
                    } else if (this.keysUp.indexOf(keyCode) !== -1) {
                        this.direction.copyFromFloats(0, 0, speed);
                    } else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera.rotation.y += this.angularSpeed;
                        this.direction.copyFromFloats(0, 0, 0);
                    } else if (this.keysDown.indexOf(keyCode) !== -1) {
                        this.direction.copyFromFloats(0, 0, -speed);
                    }

                    if (camera.getScene().useRightHandedSystem) {
                        this.direction.z *= -1;
                    }
                    camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                    BABYLON.Vector3.TransformNormalToRef(this.direction, camera._cameraTransformMatrix, camera._transformedDirection);
                    camera.cameraDirection.addInPlace(camera._transformedDirection);
                }
            }
        }


        public detachControl(): void {
            var element = this.camera?.getEngine().getInputElement();

            if (element && this._onKeyDown && this._onKeyUp) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);

                BABYLON.Tools.UnregisterTopRootEvents(window, [
                    { name: "blur", handler: this._onLostFocus }
                ]);

                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        }


        public getClassName(): string { return 'FreeCameraKeyboardWalkInput'; }


        public getSimpleName(): string { return 'keyboard'; }


        private _onLostFocus(_event: FocusEvent) { this._keys = []; }
    }
}