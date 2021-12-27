/// <reference path="babylon.module.d.ts"/>

namespace Hepzi {
    export class GuiClient {
        private _canvas: HTMLCanvasElement;
        private _engine: BABYLON.Engine;
        private _keysDown: {[index: string]: boolean} = {};
        private _isDebug: boolean;
        private _renderLoop: (() => void) | null = null;
        private _scene: BABYLON.Scene | null;


        public constructor(factory: IFactory, canvasName: string) {
            const canvas = canvasName? document.getElementById(canvasName): null;

            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                throw Error(`${canvas} is not an HTMLCanvasElement`);
            }

            const self = this;

            this._canvas = canvas;
            this._engine = new BABYLON.Engine(this._canvas, true, { preserveDrawingBuffer: true, stencil: true });
            this._isDebug = factory.isDebug('GuiClient');
            this._scene = null;

            document.addEventListener('mouseleave', () => self.onMouseLeave());
            canvas.addEventListener('mouseenter', () => canvas.focus());
            window.addEventListener('resize', () => self._engine.resize());
        }


        public addAvatar(session: any): any {
            const scene = this._scene;
            let avatar = null;

            if (scene) {
                const material = new BABYLON.StandardMaterial('material', scene);

                material.alpha = 1;
                material.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);

                const sphere = BABYLON.Mesh.CreateSphere('sphere', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);

                sphere.position.y = 1;
                sphere.material = material;
            }

            return avatar;
        }


        private addKeyboardHandler() {
            const self = this;
            const scene = this._scene;

            scene?.onKeyboardObservable.add((kbInfo) => {
                if (self._scene === scene) {
                    switch (kbInfo.type) {
                        case BABYLON.KeyboardEventTypes.KEYDOWN:
                            console.log("KEY DOWN: ", kbInfo.event.key, kbInfo.event.code, kbInfo.event.shiftKey);
                            break;
                        case BABYLON.KeyboardEventTypes.KEYUP:
                            console.log("KEY UP: ", kbInfo.event.key, kbInfo.event.code, kbInfo.event.shiftKey);
                            break;
                    }
                }
            });
        }


        private addMouseHandler() {
            const self = this;
            const scene = this._scene;

            scene?.onPointerObservable.add((pointerInfo) => {
                if (self._scene === scene) {
                    switch (pointerInfo.type) {
                        case BABYLON.PointerEventTypes.POINTERDOWN:
                            console.log("POINTER DOWN");
                            break;
                        case BABYLON.PointerEventTypes.POINTERUP:
                            console.log("POINTER UP");
                            break;
                        case BABYLON.PointerEventTypes.POINTERMOVE:
                            //console.log("POINTER MOVE");
                            break;
                        case BABYLON.PointerEventTypes.POINTERWHEEL:
                            console.log("POINTER WHEEL");
                            break;
                        case BABYLON.PointerEventTypes.POINTERPICK:
                            console.log("POINTER PICK");
                            break;
                        case BABYLON.PointerEventTypes.POINTERTAP:
                            console.log("POINTER TAP");
                            break;
                        case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                            console.log("POINTER DOUBLE-TAP");
                            break;
                    }
                }
            });
        }


        public createScene() {
            if (this._isDebug) {
                console.log('CREATING SCENE');
            }

            if (this._scene) {
                throw Error('Cannot create scene: already created.')
            }
            const scene = new BABYLON.Scene(this._engine);
            const camera = new BABYLON.FreeCamera('main-camera', new BABYLON.Vector3(0, 5, -10), scene);

            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(this._canvas, false);

            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            const ground = BABYLON.Mesh.CreateGround('terrain', 6, 6, 2, scene, false);

            this._scene = scene;
            this.addKeyboardHandler();
            this.addMouseHandler();

            if (this._isDebug) {
                console.log('SCENE CREATED');
            }
        }


        private onMouseLeave(): void {
            console.log('MouseLeave');
        }


        public startRun() {
            const self = this;
            const scene = self._scene;

            if (!scene) {
                throw Error('Cannot start render-loop: scene is not initialised.');
            }

            if (this._renderLoop) {
                throw Error('Cannot start render-loop: already running.');
            }

            this._renderLoop = () => { if (scene == self._scene) { scene.render() } };
            this._engine.runRenderLoop(this._renderLoop);
        }
        

        public stopRun() {
            if (this._renderLoop) {
                if (this._isDebug) {
                    console.log('STOPPING RENDER');
                }
                this._engine.stopRenderLoop(this._renderLoop);
                this._renderLoop = null;
                this._scene?.dispose();
                this._scene = null;

                console.log('RENDER STOPPED');
            } else {
                console.log('WARN: render-loop is not running so cannot be stopped.')
            }
        }
    }
}