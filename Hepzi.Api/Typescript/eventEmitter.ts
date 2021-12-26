﻿namespace Hepzi {
    export class EventEmitter<TEventName extends string, TData> {
        private _callbacks: { [index: string]: ((data: TData) => void)[] } = {};


        public emit(key: string, data: TData) {
            const callbacks = (this._callbacks[key] || []).slice();

            callbacks.forEach(callback => callback(data));
        }


        public on(eventName: TEventName, callback: (data: TData) => void) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).concat(callback);
        }


        public off(eventName: TEventName, callback: (data: TData) => void) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).filter(c => c !== callback);
        }
    }
}