/// <reference path="../external/babylon.module.d.ts"/>

namespace Hepzi {
    export class FreeCameraSearchInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
        public angularSensibility: number;
        public buttons: number[];
        public camera: BABYLON.Nullable<BABYLON.FreeCamera> | null = null;
        private _observer: BABYLON.Nullable<BABYLON.Observer<BABYLON.PointerInfo>> = null;
        public previousPosition: { x: number; y: number; } | null = null;
        public restrictionX: number;
        public restrictionY: number;
        private _onSearchMove: ((event: MouseEvent) => void) | null = null;
        private _pointerInput: ((eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState) => void) | null = null;
        public touchEnabled: boolean;
                

        public constructor(touchEnabled: boolean) {
            if (touchEnabled === void 0) {
                touchEnabled = true;
            }
            this.touchEnabled = touchEnabled;

            this.angularSensibility = 2000.0;
            this.buttons = [0, 1, 2];
            this.restrictionX = 100;
            this.restrictionY = 60;
        }


        public attachControl(noPreventDefault?: boolean): void {
            const self = this;
            const camera = self.camera;
            const engine = camera?.getEngine();
            const element = engine?.getInputElement();           

            if (camera && engine && element && !this._pointerInput) {
                const angle = { x: 0, y: 0 };

                this._pointerInput = function (pointerInfo: BABYLON.PointerInfo, _: BABYLON.EventState) {
                    const type = pointerInfo.type;
                    const event = pointerInfo.event;

                    if (!self.touchEnabled && event.pointerType === "touch") {
                        return;
                    }

                    if (type !== BABYLON.PointerEventTypes.POINTERMOVE && self.buttons.indexOf(event.button) === -1) {
                        return;
                    }

                    switch (type) {
                        case BABYLON.PointerEventTypes.POINTERDOWN:
                            try { event.srcElement.setPointerCapture(event.pointerId); } catch (_) { /*IGNORE*/ }

                            self.previousPosition = { x: event.clientX, y: event.clientY };

                            if (!noPreventDefault) {
                                event.preventDefault();
                                element.focus();
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERUP:
                            try { event.srcElement.releasePointerCapture(event.pointerId); } catch (_) { /*IGNORE*/ }

                            self.previousPosition = null;

                            if (!noPreventDefault) {
                                event.preventDefault();
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERMOVE:
                            if (!self.previousPosition || engine.isPointerLock) {
                                return;
                            }

                            var offsetX = event.clientX - self.previousPosition.x;
                            var offsetY = event.clientY - self.previousPosition.y;

                            angle.x += offsetX;
                            angle.y -= offsetY;

                            if (Math.abs(angle.x) > self.restrictionX) {
                                angle.x -= offsetX;
                            }

                            if (Math.abs(angle.y) > self.restrictionY) {
                                angle.y += offsetY;
                            }

                            if (camera.getScene().useRightHandedSystem) {
                                if (Math.abs(angle.x) < self.restrictionX) {
                                    camera.cameraRotation.y -= offsetX / self.angularSensibility;
                                }
                            } else if (Math.abs(angle.x) < self.restrictionX) {
                                camera.cameraRotation.y += offsetX / self.angularSensibility;
                            }

                            if (Math.abs(angle.y) < self.restrictionY) {
                                camera.cameraRotation.x += offsetY / self.angularSensibility;
                            }

                            self.previousPosition = { x: event.clientX, y: event.clientY };

                            if (!noPreventDefault) {
                                event.preventDefault();
                            }
                            break;
                    }
                };

                this._onSearchMove = function (event: MouseEvent) {
                    if (!engine.isPointerLock) {
                        return;
                    }
                    var offsetX = event.movementX || event.mozMovementX || event.webkitMovementX || event.msMovementX || 0;
                    var offsetY = event.movementY || event.mozMovementY || event.webkitMovementY || event.msMovementY || 0;

                    if (camera.getScene().useRightHandedSystem) {
                        camera.cameraRotation.y -= offsetX / self.angularSensibility;
                    } else {
                        camera.cameraRotation.y += offsetX / self.angularSensibility;
                    }

                    camera.cameraRotation.x += offsetY / self.angularSensibility;
                    self.previousPosition = null;

                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                };

                this._observer = camera.getScene().onPointerObservable.add(this._pointerInput,
                    BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);

                element.addEventListener("mousemove", this._onSearchMove, false);
            }
        }


        public checkInputs(): void {
        }


        public detachControl(): void {
            const element = this.camera?.getEngine().getInputElement();

            if (element && this.camera && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);

                if (this._onSearchMove) {
                    element.removeEventListener("mousemove", this._onSearchMove);
                }
                this._observer = null;
                this._onSearchMove = null;
                this.previousPosition = null;
            }
        }


        public getClassName(): string { return 'FreeCameraSearchInput'; }


        public getSimpleName(): string { return 'MouseSearchCamera'; }
    }
}