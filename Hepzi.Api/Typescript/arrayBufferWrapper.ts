namespace Hepzi {
    export class ArrayBufferWrapper {
        private static _decoder: TextDecoder = new TextDecoder();
        private static _encoder: TextEncoder = new TextEncoder();

        private _buffer: Uint8Array;
        private _position: number;


        constructor(buffer: ArrayBuffer) {
            this._buffer = new Uint8Array(buffer);
            this.length = buffer.byteLength;
            this._position = 0;
        }


        public static calculateBytes(text: string) { return new Blob([text]).size; }


        public getByte(): number {
            if (this._position >= this._buffer.length) {
                throw Error(`Buffer overrun reading byte ${this._position + 1} of ${this._buffer.length}`);
            }
            return this._buffer[this._position++];
        }


        public getInteger(): number {
            let value: number = 0;

            for (let i: number = 0; i < 4; ++i) {
                value <<= 8;
                value |= this.getByte();
            }

            return value;
        }


        getHex(length?: number) {
            return [...this._buffer].slice(this._position, length ? this._position + length : length)
                .map(x => ('0' + x.toString(16)).slice(-2)).join('')
        }


        public getString(length?: number) {
            return ArrayBufferWrapper._decoder
                .decode(this._buffer.slice(this._position, length ? this._position + length : length));
        }


        getVector3d() {
            const x = this.getInteger();
            const y = this.getInteger();
            const z = this.getInteger();

            return new BABYLON.Vector3(x, y, z);
        }


        public readonly length: number;


        public position(): number { return this._position };


        public putByte(value: number): void {
            if (this._position >= this._buffer.length) {
                throw Error(`Buffer overrun writing byte ${this._position + 1} of ${this._buffer.length}`);
            }
            this._buffer[this._position++] = value & 0xFF;
        }


        public putByteArray(buffer: ArrayBuffer) {
            this._buffer.set(new Uint8Array(buffer), this._position);
            this._position += buffer.byteLength;
        }


        public putInteger(value: number): void {
            for (let i: number = 3; i >= 0; --i) {
                this.putByte(value >> (8 * i));
            }
        }


        public putString(text: string) {
            const data = ArrayBufferWrapper._encoder.encode(text);

            this._buffer.set(data, 0);
            this._position += data?.length;
        }


        putVector3d(vector: BABYLON.Vector3) {
            this.putInteger(vector.x);
            this.putInteger(vector.y);
            this.putInteger(vector.z);
        }
    }
}