/// <reference path="babylon.module.d.ts"/>

namespace Hepzi {
    export class GuiClient {
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

            window.addEventListener('resize', () => self._engine.resize());
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
            const sphere = BABYLON.Mesh.CreateSphere('sphere', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);

            sphere.position.y = 1;

            const ground = BABYLON.Mesh.CreateGround('terrain', 6, 6, 2, scene, false);

            this._scene = scene;

            if (this._isDebug) {
                console.log('SCENE CREATED');
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

                console.log('RENDER STOPPED');
            } else {
                console.log('WARN: render-loop is not running so cannot be stopped.')
            }
        }
    }
}