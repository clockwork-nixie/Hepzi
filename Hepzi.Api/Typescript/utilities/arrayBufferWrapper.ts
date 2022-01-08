namespace Hepzi {
    export class ArrayBufferWrapper {
        private static _decoder: TextDecoder = new TextDecoder();
        private static _encoder: TextEncoder = new TextEncoder();

        private _buffer: Uint8Array;
        private _position: number;


        constructor(buffer: ArrayBuffer, length: number | null = null) {
            this._buffer = new Uint8Array(buffer);
            this.length = (length || length === 0)? length: buffer.byteLength;
            this._position = 0;
        }


        public static calculateBytes(text: string) { return new Blob([text]).size; }


        public getByte(): number {
            if (this._position >= this.length) {
                throw Error(`Buffer overrun reading byte ${this._position + 1} of ${this.length}`);
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


        getHex(length?: number): string {
            if ((this._position + (length || 0)) > this.length) {
                throw Error(`Buffer overrun reading hex[${this._position}..${this._position + (length ?? 0)}] of ${this.length}`);
            }
            return [...this._buffer].slice(this._position, length ? this._position + length : length)
                .map(x => ('0' + x.toString(16)).slice(-2)).join('')
        }


        public getString(length?: number) {
            if ((this._position + (length || 0)) > this.length) {
                throw Error(`Buffer overrun reading hex[${this._position}..${this._position + (length ?? 0)}] of ${this.length}`);
            }
            return ArrayBufferWrapper._decoder
                .decode(this._buffer.slice(this._position, length ? this._position + length : length));
        }


        getVector3d(scale: number = 1): BABYLON.Vector3 {
            const x = this.getInteger() / scale;
            const y = this.getInteger() / scale;
            const z = this.getInteger() / scale;

            return new BABYLON.Vector3(x, y, z);
        }


        public readonly length: number;


        public position(): number { return this._position };


        public putByte(value: number): void {
            if (this._position >= this.length) {
                throw Error(`Buffer overrun writing byte ${this._position + 1} of ${this.length}`);
            }
            this._buffer[this._position++] = value & 0xFF;
        }


        public putArray(buffer: ArrayBuffer): void {
            this.putByteArray(new Uint8Array(buffer));
        }


        public putByteArray(buffer: Uint8Array) {
            if ((this._position + buffer.length) > this.length) {
                throw Error(`Buffer overrun writing array[0..${buffer.length}] to ${this._position + 1} of ${this.length}`);
            }
            this._buffer.set(buffer, this._position);
            this._position += buffer.byteLength;
        }


        public putInteger(value: number): void {
            for (let i: number = 3; i >= 0; --i) {
                this.putByte(value >> (8 * i));
            }
        }


        public putString(text: string) {
            this.putByteArray(ArrayBufferWrapper._encoder.encode(text));
        }


        putVector3d(vector: BABYLON.Vector3, scale: number = 1) {
            this.putInteger(vector.x * scale);
            this.putInteger(vector.y * scale);
            this.putInteger(vector.z * scale);
        }
    }
}