/// <reference path="../external/babylon.module.d.ts"/>
/// <reference path="../utilities/eventEmitter.ts" />

namespace Hepzi {
    export type InputEventName = 'console' | 'escape' | 'target';

    export interface IInputEvent {
        mobile?: Mobile
    }

    export class InputHandler extends EventEmitter<InputEventName, IInputEvent> {
        private readonly _isDebug: boolean;


        constructor(factory: IFactory) {
            super();

            this._isDebug = factory.isDebug('InputHandler');
        }


        public handleKey(keyInfo: BABYLON.KeyboardInfo): void {
            switch (keyInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    console.debug("KEY DOWN: ", keyInfo.event.key, keyInfo.event.code, keyInfo.event.shiftKey);

                    switch (keyInfo.event.key) {
                        case '`':
                            this.emit('console', {});
                            break;

                        case 'Escape':
                            this.emit('escape', {});
                            break;
                    }
                    break;

                case BABYLON.KeyboardEventTypes.KEYUP:
                    console.debug("KEY UP: ", keyInfo.event.key, keyInfo.event.code, keyInfo.event.shiftKey);
                    break;
            }
        }


        handlePick(event: PointerEvent, mesh: BABYLON.AbstractMesh, model: HepziModel | null) {
            if (this._isDebug) {
                console.debug(`Picked: ${mesh?.name}: button=${event.button} mobile=${!!model?.mobile}`);
            }

            if (model?.mobile && event.button === 0) {
                this.emit('target', { mobile: model.mobile });
            }
        }


        public handlePointer(pointerInfo: BABYLON.PointerInfo, event: PointerEvent): void {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    console.debug(`POINTER DOWN: ${event.button}`);

                    if (event.button === 2) {
                        //const down = new BABYLON.Vector3(0, -1, 0);
                        //var m = mesh.getWorldMatrix();
                        //var v = BABYLON.Vector3.TransformCoordinates(vector, m);

                        //const 
                    }
                    break;

                case BABYLON.PointerEventTypes.POINTERUP:
                    console.debug(`POINTER UP: ${event.button}`);
                    break;

                case BABYLON.PointerEventTypes.POINTERWHEEL:
                    console.debug(`POINTER WHEEL: ${event.button}`);
                    break;

                case BABYLON.PointerEventTypes.POINTERTAP:
                    console.debug(`POINTER TAP: ${event.button}`);
                    break;

                case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                    console.debug(`POINTER DOUBLETAP: ${event.button}`);
                    break;

                default:
                    console.debug(`POINTER UNKNOWN: ${event.button}`);
                    break;
            }
        }
    }
}