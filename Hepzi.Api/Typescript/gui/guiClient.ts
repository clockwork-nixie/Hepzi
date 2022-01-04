/// <reference path="../external/babylon.module.d.ts"/>
/// <reference path="../avatar.ts" />

namespace Hepzi {
    class HepziModel {
        avatar?: Avatar;
    }

    interface IModelMesh extends BABYLON.Mesh {
        hepziModel?: HepziModel | null;
    }


    export class GuiClient {
        private _avatar?: Avatar | null;
        private _camera?: BABYLON.FreeCamera | null;
        private _canvas: HTMLCanvasElement;
        private _engine: BABYLON.Engine;
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


        public addAvatar(avatar: Avatar): void {
            const scene = this._scene;

            if (scene) {
                const material = new BABYLON.StandardMaterial('material', scene);

                material.alpha = 1;
                material.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);

                const mesh = BABYLON.Mesh.CreateHemisphere(`avatar:${avatar.name}`, 16, 2, scene);

                mesh.position = avatar.position;
                mesh.material = material;

                ((mesh as IModelMesh).hepziModel = new HepziModel()).avatar = avatar;
                avatar.mesh = mesh;

                var self = this;

                avatar.updateRotation = () => self.setRotation(avatar);
                avatar.updateRotation();

                if (avatar.isSelf) {
                    const camera = new BABYLON.FreeCamera('main-camera', avatar.position, scene);

                    if (avatar.mesh.rotationQuaternion) {
                        camera.rotationQuaternion = avatar.mesh.rotationQuaternion;
                    }
                    camera.attachControl(this._canvas, false);

                    this._avatar = avatar;
                    this._camera = camera;
                }
            }
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
                        case BABYLON.PointerEventTypes.POINTERUP:
                        case BABYLON.PointerEventTypes.POINTERWHEEL:
                            break;

                        case BABYLON.PointerEventTypes.POINTERMOVE:
                            if (this._avatar && this._camera && this._camera.rotationQuaternion) {
                                const quaternion = this._camera.rotationQuaternion;
                                const unitVector = new BABYLON.Vector3(1, 0, 0);

                                unitVector.rotateByQuaternionToRef(quaternion, this._avatar.direction);
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERPICK:
                            console.log("POINTER PICK");
                            const avatar = (pointerInfo.pickInfo?.pickedMesh as IModelMesh)?.hepziModel?.avatar;

                            if (avatar) {
                                console.log(`Picked: ${avatar.name}`);
                            }
                            break;

                        case BABYLON.PointerEventTypes.POINTERTAP:
                        case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
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
            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            const ground = BABYLON.Mesh.CreateGround('terrain', 6, 6, 2, scene, false);

            const material = new BABYLON.StandardMaterial('ground-material', scene);

            material.alpha = 0.5;
            material.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.4);

            ground.material = material;

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


        public removeAvatar(avatar: Avatar): void {
            const model = (avatar.mesh as IModelMesh)?.hepziModel;

            if (this._scene && model) {
                (avatar.mesh as IModelMesh).hepziModel = null;
                avatar.mesh?.dispose();
            }

            avatar.mesh = null;
        }


        public setRotation(avatar: Avatar): void {
            if (avatar.mesh) {
                if (!(avatar.direction.x || avatar.direction.y || avatar.direction.z)) {
                    avatar.direction.x = 1;
                }

                const rotationQuaternion = BABYLON.Quaternion.FromEulerVector(avatar.direction.normalize());

                avatar.mesh.rotationQuaternion = rotationQuaternion;
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
        

        public stopRun() {
            if (this._renderLoop) {
                if (this._isDebug) {
                    console.log('STOPPING RENDER');
                }
                this._engine.stopRenderLoop(this._renderLoop);
                this._renderLoop = null;
                this._scene?.dispose();
                this._scene = null;
                this._avatar = null;
                this._camera = null;

                console.log('RENDER STOPPED');
            } else {
                console.log('WARN: render-loop is not running so cannot be stopped.')
            }
        }
    }
}