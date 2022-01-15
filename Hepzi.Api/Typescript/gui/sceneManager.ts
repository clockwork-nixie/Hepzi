/// <reference path="../external/babylon.module.d.ts"/>

namespace Hepzi {
    export class HepziModel {
        mobile?: Mobile;
    }


    interface IModelMesh extends BABYLON.Mesh {
        hepziModel?: HepziModel | null;
    }


    export class SceneManager {
        private _camera?: BABYLON.FreeCamera | null;
        private _canvas: HTMLCanvasElement;
        private _context: ApplicationContext | null;
        private _engine: BABYLON.Engine;
        private readonly _inputHandler: InputHandler;
        private _isDebug: boolean;
        private _renderLoop: (() => void) | null = null;
        private _scene: BABYLON.Scene | null;


        public constructor(factory: IFactory, canvasName: string, inputHandler: InputHandler) {
            const canvas = canvasName ? document.getElementById(canvasName) : null;

            if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
                throw Error(`${canvas} is not an HTMLCanvasElement`);
            }

            this._canvas = canvas;
            this._engine = new BABYLON.Engine(this._canvas, true, { preserveDrawingBuffer: true, stencil: true });
            this._inputHandler = inputHandler;
            this._isDebug = factory.isDebug('SceneManager');
            this._context = null;
            this._scene = null;

            document.addEventListener('mouseleave', this.onMouseLeave.bind(this));
            canvas.addEventListener('mouseenter', () => canvas.focus());
            window.addEventListener('resize', this._engine.resize.bind(this._engine));
        }


        public addMobile(mobile: Mobile): void {
            if (mobile.mesh) {
                throw Error(`Avatar for ${mobile.name} already has a mesh.`);
            }

            const scene = this._scene;

            if (!scene) {
                throw Error('Avatar cannot be added until scene is initialised.');
            }

            const material = new BABYLON.StandardMaterial('material', scene);

            material.alpha = 1;
            material.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);

            const mesh = BABYLON.Mesh.CreateHemisphere(`avatar:${mobile.name}`, 16, 2, scene);

            mesh.position = mobile.position;
            mesh.material = material;

            ((mesh as IModelMesh).hepziModel = new HepziModel()).mobile = mobile;

            mobile.mesh = mesh;
            mobile.setMeshRotationFromDirection();
        }


        private addKeyboardHandler() {
            const self = this;
            const scene = this._scene;

            scene?.onKeyboardObservable.add((keyInfo) => {
                if (self._scene === scene) {
                    this._inputHandler.handleKey(keyInfo);
                }
            });
        }


        private addMouseHandler() {
            const self = this;
            const scene = this._scene;

            scene?.onPointerObservable.add((pointerInfo) => {
                if (self._scene === scene) {
                    const event = pointerInfo.event as PointerEvent;

                    switch (pointerInfo.type) {
                        case BABYLON.PointerEventTypes.POINTERMOVE:
                            if (this._context && this._camera) {
                                this._context.protagonist.direction.copyFrom(this._camera.cameraDirection);
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERPICK:
                            const mesh = pointerInfo.pickInfo?.pickedMesh;
                            (pointerInfo.event as PointerEvent)

                            if (mesh) {
                                self._inputHandler.handlePick(event, mesh, (mesh as IModelMesh)?.hepziModel ?? null);
                            } else if (this._isDebug) {
                                console.debug('Pick with no mesh.');
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERDOWN:
                        case BABYLON.PointerEventTypes.POINTERUP:
                        case BABYLON.PointerEventTypes.POINTERWHEEL:
                        case BABYLON.PointerEventTypes.POINTERTAP:
                        case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                            self._inputHandler.handlePointer(pointerInfo, event);
                            break;
                    }
                }
            });
        }


        public createScene(context: ApplicationContext): void {
            if (this._isDebug) {
                console.log('CREATING SCENE');
            }

            if (this._scene) {
                throw Error('Cannot create scene: already created.')
            }

            if (!context?.protagonist.isProtagonist) {
                throw Error(`Avatar for ${context?.protagonist.name} is not a protagonist.`);
            }

            const protagonist = context.protagonist;
            const scene = new BABYLON.Scene(this._engine);

            this.loadScene(scene);
            this._scene = scene;
            this.addMobile(protagonist);

            if (!protagonist.mesh?.rotationQuaternion) {
                throw Error('Protagonist rotation not set.');
            }

            const camera = new BABYLON.FreeCamera('camera:protagonist', protagonist.position, this._scene);

            if (camera.inputs._mouseInput) {
                camera.inputs._mouseInput.buttons = [0];
            }

            camera.rotationQuaternion = protagonist.mesh.rotationQuaternion;
            camera.attachControl(null, false);

            this._context = context;
            this._camera = camera;
            this.addKeyboardHandler();
            this.addMouseHandler();

            if (this._isDebug) {
                console.log('SCENE CREATED');
            }
        }


        public destroyScene(): void {

        }


        private loadScene(scene: BABYLON.Scene): void {
            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            const ground = BABYLON.MeshBuilder.CreateGround('terrain', { width: 6, height: 6, subdivisions: 2, updatable: false }, scene);
            const material = new BABYLON.StandardMaterial('ground-material', scene);

            material.alpha = 0.5;
            material.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.4);

            ground.material = material;
        }


        private onMouseLeave(): void {
            console.log('MouseLeave');
        }


        public removeMobile(mobile: Mobile): void {
            const model = (mobile.mesh as IModelMesh)?.hepziModel;

            if (model) {
                (mobile.mesh as IModelMesh).hepziModel = null;                
            }

            mobile.mesh?.dispose();
            mobile.mesh = null;

            if (this._context?.protagonist === mobile) {
                this._camera?.dispose();
                this._camera = null;
                this._context = null;
            }
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


        public stopRun(): void {
            if (!this._renderLoop) {
                if (this._isDebug) {
                    console.debug('Render-loop is not running so cannot be stopped.');
                }
            } else {
                if (this._isDebug) {
                    console.debug('Render loop stopping.');
                }

                this._engine.stopRenderLoop(this._renderLoop);
                this._renderLoop = null;

                this._camera?.dispose();
                this._camera = null;

                this._scene?.dispose();
                this._scene = null;

                // TODO: dispose avatar?
                this._context = null;

                if (this._isDebug) {
                    console.debug('Render loop stopped.');
                }
            }
        }
    }
}