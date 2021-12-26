/// <reference path="babylon.module.d.ts"/>

namespace Hepzi {
    export class GuiClient {
        public initialise(canvasName: string) {
            const canvas = document.getElementById(canvasName);

            if (canvas && canvas instanceof HTMLCanvasElement) {
                console.log("YAY");
                var engine = new BABYLON.Engine(canvas as HTMLCanvasElement, true, { preserveDrawingBuffer: true, stencil: true });
            }
        }
    }
}