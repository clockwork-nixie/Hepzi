/// <reference path="babylon.module.d.ts"/>

namespace Hepzi {
    export class GuiClient {
        public initialise(canvasName: string) {
            const canvas = document.getElementById(canvasName);

            if (canvas && canvas instanceof HTMLCanvasElement) {
                console.log("YAY");
                var engine = new BABYLON.Engine(canvas as HTMLCanvasElement, true, { preserveDrawingBuffer: true, stencil: true });

                var createScene = function () {
                    var scene = new BABYLON.Scene(engine);
                    var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);

                    camera.setTarget(BABYLON.Vector3.Zero());
                    camera.attachControl(canvas, false);

                    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
                    var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene, false, BABYLON.Mesh.FRONTSIDE);

                    sphere.position.y = 1;

                    var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene, false);

                    return scene;
                }

                var scene = createScene();

                engine.runRenderLoop(function () {
                    scene.render();
                });

                window.addEventListener('resize', function () {
                    engine.resize();
                });
            }
        }
    }
}