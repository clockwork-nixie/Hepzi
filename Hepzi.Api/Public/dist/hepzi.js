"use strict";
var Hepzi;
(function (Hepzi) {
    let ClientCategory;
    (function (ClientCategory) {
        ClientCategory[ClientCategory["Debug"] = 0] = "Debug";
        ClientCategory[ClientCategory["Normal"] = 1] = "Normal";
        ClientCategory[ClientCategory["Important"] = 2] = "Important";
        ClientCategory[ClientCategory["System"] = 3] = "System";
        ClientCategory[ClientCategory["Error"] = 4] = "Error";
    })(ClientCategory = Hepzi.ClientCategory || (Hepzi.ClientCategory = {}));
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class Avatar {
        constructor(username, isSelf, userId, position, direction) {
            this.direction = direction;
            this.isSelf = isSelf;
            this.name = username;
            this.mesh = null;
            this.position = position;
            this.updateRotation = () => { };
            this.userId = userId;
            this._lastDirection = new BABYLON.Vector3();
            this._lastPosition = new BABYLON.Vector3();
        }
        hasPositionOrDirectionChanged() {
            return !(this._lastDirection.equals(this.direction) &&
                this._lastPosition.equals(this.position));
        }
        updateLastPositionAndDirection() {
            this._lastDirection.copyFrom(this.direction);
            this._lastPosition.copyFrom(this.position);
        }
    }
    Hepzi.Avatar = Avatar;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ArrayBufferWrapper {
        constructor(buffer) {
            this._buffer = new Uint8Array(buffer);
            this.length = buffer.byteLength;
            this._position = 0;
        }
        static calculateBytes(text) {
            return new Blob([text]).size;
        }
        getByte() {
            if (this._position >= this.length) {
                throw Error(`Buffer overrun reading byte ${this._position + 1} of ${this.length}`);
            }
            return this._buffer[this._position++];
        }
        getInteger() {
            let value = 0;
            for (let i = 0; i < 4; ++i) {
                value <<= 8;
                value |= this.getByte();
            }
            return value;
        }
        getHex(length) {
            if ((this._position + (length || 0)) > this.length) {
                throw Error(`Buffer overrun reading hex[${this._position}..${this._position + (length !== null && length !== void 0 ? length : 0)}] of ${this.length}`);
            }
            return [...this._buffer].slice(this._position, length ? this._position + length : length)
                .map(x => ('0' + x.toString(16)).slice(-2)).join('');
        }
        getString(length) {
            if ((this._position + (length || 0)) > this.length) {
                throw Error(`Buffer overrun reading hex[${this._position}..${this._position + (length !== null && length !== void 0 ? length : 0)}] of ${this.length}`);
            }
            return ArrayBufferWrapper._decoder
                .decode(this._buffer.slice(this._position, length ? this._position + length : length));
        }
        getVector3d(scale = 1) {
            const x = this.getInteger() / scale;
            const y = this.getInteger() / scale;
            const z = this.getInteger() / scale;
            return new BABYLON.Vector3(x, y, z);
        }
        position() {
            return this._position;
        }
        ;
        putByte(value) {
            if (this._position >= this.length) {
                throw Error(`Buffer overrun writing byte ${this._position + 1} of ${this.length}`);
            }
            this._buffer[this._position++] = value & 0xFF;
        }
        putArray(buffer) { this.putByteArray(new Uint8Array(buffer)); }
        putByteArray(buffer) {
            if ((this._position + buffer.length) > this.length) {
                throw Error(`Buffer overrun writing array[0..${buffer.length}] to ${this._position + 1} of ${this.length}`);
            }
            this._buffer.set(buffer, this._position);
            this._position += buffer.byteLength;
        }
        putInteger(value) {
            for (let i = 3; i >= 0; --i) {
                this.putByte(value >> (8 * i));
            }
        }
        putString(text) {
            this.putByteArray(ArrayBufferWrapper._encoder.encode(text));
        }
        putVector3d(vector, scale = 1) {
            this.putInteger(vector.x * scale);
            this.putInteger(vector.y * scale);
            this.putInteger(vector.z * scale);
        }
    }
    ArrayBufferWrapper._decoder = new TextDecoder();
    ArrayBufferWrapper._encoder = new TextEncoder();
    Hepzi.ArrayBufferWrapper = ArrayBufferWrapper;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    let ClientRequestType;
    (function (ClientRequestType) {
        ClientRequestType[ClientRequestType["Unknown"] = 0] = "Unknown";
        ClientRequestType[ClientRequestType["InstanceMessage"] = 1] = "InstanceMessage";
        ClientRequestType[ClientRequestType["KickClient"] = 2] = "KickClient";
        ClientRequestType[ClientRequestType["MoveClient"] = 3] = "MoveClient";
    })(ClientRequestType = Hepzi.ClientRequestType || (Hepzi.ClientRequestType = {}));
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientCommandBuilder {
        static MoveClient(avatar) {
            const buffer = new ArrayBuffer(25);
            const writer = new Hepzi.ArrayBufferWrapper(buffer);
            writer.putByte(Hepzi.ClientRequestType.MoveClient);
            writer.putVector3d(avatar.position, 100);
            writer.putVector3d(avatar.direction, 100);
            return buffer;
        }
    }
    Hepzi.ClientCommandBuilder = ClientCommandBuilder;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientCommandInterpreter {
        interpretCommand(userId, request, avatars) {
            let result;
            try {
                const words = request.split(' ').filter(s => s ? s : null);
                if (words.length) {
                    const command = words[0].toLowerCase();
                    switch (command) {
                        case '/exit':
                            result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.Unknown);
                            result.isTerminal = true;
                            result.log = 'EXIT';
                            break;
                        case '/kick':
                            result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.KickClient);
                            if (words.length < 2) {
                                result.message = `Syntax should be: ${command} <name>`;
                                result.category = Hepzi.ClientCategory.Error;
                            }
                            else {
                                const name = words[1];
                                const targetAvatar = this.getUserIdByAvatarName(name, avatars);
                                if (targetAvatar) {
                                    const buffer = new ArrayBuffer(5);
                                    const writer = new Hepzi.ArrayBufferWrapper(buffer);
                                    writer.putByte(result.command);
                                    writer.putInteger(targetAvatar);
                                    result.buffer = buffer;
                                    result.log = `SEND KICK #${userId}`;
                                    result.message = `${command} ${name}`;
                                }
                                else {
                                    result.message = `Cannot kick unknown user: ${name}`;
                                    result.category = Hepzi.ClientCategory.Error;
                                }
                            }
                            break;
                        case '/system':
                            const remainder = request.slice(command.length).trim();
                            const message = new TextEncoder().encode(remainder);
                            const buffer = new ArrayBuffer(1 + message.length);
                            const writer = new Hepzi.ArrayBufferWrapper(buffer);
                            result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.InstanceMessage);
                            writer.putByte(result.command);
                            writer.putByteArray(message);
                            result.buffer = buffer;
                            result.log = `SEND SYSTEM: ${remainder}`;
                            break;
                        case '/who':
                            result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.Unknown);
                            result.message = [`${command}`].concat(Object.keys(avatars).map(userId => { var _a; return `\u2022 ${(_a = avatars[parseInt(userId)]) === null || _a === void 0 ? void 0 : _a.name}`; }));
                            result.log = 'WHO';
                            break;
                        default:
                            result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.Unknown);
                            result.message = `Unknown command: ${command}`;
                            result.category = Hepzi.ClientCategory.Error;
                    }
                }
                else {
                    result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.Unknown);
                    result.message = `(nothing to send)`;
                    result.category = Hepzi.ClientCategory.Debug;
                }
            }
            catch (error) {
                result = new Hepzi.ClientCommand(Hepzi.ClientRequestType.Unknown);
                result.log = `ERROR interpreting input: ${error}`;
                result.message = `Error: ${error}`;
                result.category = Hepzi.ClientCategory.Error;
            }
            return result;
        }
        getUserIdByAvatarName(name, avatars) {
            name = name.toLowerCase();
            return parseInt(Object.keys(avatars).filter(userId => { var _a; return ((_a = avatars[parseInt(userId)]) === null || _a === void 0 ? void 0 : _a.name.toLowerCase()) == name; })[0]) || null;
        }
    }
    Hepzi.ClientCommandInterpreter = ClientCommandInterpreter;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    let ClientResponseType;
    (function (ClientResponseType) {
        ClientResponseType[ClientResponseType["Unknown"] = 0] = "Unknown";
        ClientResponseType[ClientResponseType["Welcome"] = 1] = "Welcome";
        ClientResponseType[ClientResponseType["Heartbeat"] = 2] = "Heartbeat";
        ClientResponseType[ClientResponseType["InitialInstanceSession"] = 3] = "InitialInstanceSession";
        ClientResponseType[ClientResponseType["AddInstanceSession"] = 4] = "AddInstanceSession";
        ClientResponseType[ClientResponseType["RemoveInstanceSession"] = 5] = "RemoveInstanceSession";
        ClientResponseType[ClientResponseType["InstanceMessage"] = 6] = "InstanceMessage";
        ClientResponseType[ClientResponseType["KickClient"] = 7] = "KickClient";
        ClientResponseType[ClientResponseType["MoveClient"] = 8] = "MoveClient";
    })(ClientResponseType = Hepzi.ClientResponseType || (Hepzi.ClientResponseType = {}));
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientResponseParser {
        constructor(factory) {
            this._isDebug = factory.isDebug('ClientResponseParser');
        }
        parseResponse(userId, response, avatars) {
            let result;
            try {
                if (response instanceof ArrayBuffer) {
                    result = this.parseBinaryResponse(userId, new Hepzi.ArrayBufferWrapper(response), avatars);
                }
                else if (typeof response === 'string' || response instanceof String) {
                    result = new Hepzi.ClientResponse(Hepzi.ClientResponseType.InstanceMessage);
                    result.log = this._isDebug ? `SYSTEM MESSAGE: ${response}` : undefined;
                    result.message = `**** ${response} ****`;
                    result.category = Hepzi.ClientCategory.System;
                }
                else {
                    result = new Hepzi.ClientResponse(Hepzi.ClientResponseType.Unknown);
                    result.log = `UNKNOWN RESPONSE MESSAGE TYPE: ${typeof response}: ${response}`;
                    result.message = `Unknown response message ${typeof response}: ${response}`;
                    result.category = Hepzi.ClientCategory.Error;
                }
            }
            catch (error) {
                result = new Hepzi.ClientResponse(Hepzi.ClientResponseType.Unknown);
                result.log = `ERROR parsing client response: ${error}`;
                result.message = `Error parsing client response: ${error}`;
                result.category = Hepzi.ClientCategory.Error;
            }
            return result;
        }
        parseAvatar(sessionUserId, buffer) {
            const userId = buffer.getInteger();
            const position = buffer.getVector3d(100);
            const direction = buffer.getVector3d(100);
            const name = buffer.getString();
            return new Hepzi.Avatar(name, userId === sessionUserId, userId, position, direction);
        }
        parseBinaryResponse(userId, buffer, avatars) {
            var _a;
            let result;
            if (buffer.length <= 0) {
                result = new Hepzi.ClientResponse(Hepzi.ClientResponseType.Unknown);
                result.message = "Empty binary message received from server";
                result.category = Hepzi.ClientCategory.Debug;
            }
            else {
                result = new Hepzi.ClientResponse(buffer.getByte());
                switch (result.responseType) {
                    case Hepzi.ClientResponseType.Welcome:
                        result.log = this._isDebug ? 'JOINING' : undefined;
                        result.message = 'Connected to instance.';
                        break;
                    case Hepzi.ClientResponseType.Heartbeat:
                        result.log = 'HEARTBEAT';
                        result.message = 'Heatbeat from instance.';
                        result.category = Hepzi.ClientCategory.Debug;
                        break;
                    case Hepzi.ClientResponseType.InitialInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        avatars[result.userId] = result.avatar;
                        result.log = this._isDebug ? `INITIAL USER: #${result.userId} => ${result.avatar.name}` : undefined;
                        result.message = `${result.avatar.name} is here.`;
                        break;
                    case Hepzi.ClientResponseType.AddInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        avatars[result.userId] = result.avatar;
                        result.log = this._isDebug ? `ADD USER: #${result.userId} => ${result.avatar.name}` : undefined;
                        result.message = result.userId === userId ? 'You have joined the area.' : `${result.avatar.name} has joined the area.`;
                        result.category = Hepzi.ClientCategory.Important;
                        break;
                    case Hepzi.ClientResponseType.RemoveInstanceSession:
                        result.userId = buffer.getInteger();
                        result.avatar = avatars[result.userId];
                        const avatarName = ((_a = result.avatar) === null || _a === void 0 ? void 0 : _a.name) || `User#${result.userId}`;
                        result.log = this._isDebug ? `REMOVE USER: #${result.userId}` : undefined;
                        result.message = result.userId !== userId ? `${avatarName} has left the area.` : '';
                        result.category = Hepzi.ClientCategory.Important;
                        delete avatars[result.userId];
                        break;
                    case Hepzi.ClientResponseType.InstanceMessage:
                        const text = buffer.getString();
                        result.log = this._isDebug ? `INSTANCE MESSAGE: ${text}` : undefined;
                        result.message = `**** ${text} ****`;
                        result.category = Hepzi.ClientCategory.System;
                        break;
                    case Hepzi.ClientResponseType.KickClient:
                        result.log = this._isDebug ? 'KICKED' : undefined;
                        result.message = `Your session has been terminated.`;
                        result.category = Hepzi.ClientCategory.System;
                        result.isTerminal = true;
                        break;
                    case Hepzi.ClientResponseType.MoveClient:
                        result.userId = buffer.getInteger();
                        const position = buffer.getVector3d(100);
                        const direction = buffer.getVector3d(100);
                        const avatar = result.avatar = avatars[result.userId];
                        if (avatar) {
                            if (!avatar.isSelf) {
                                avatar.position.copyFrom(position);
                                avatar.direction.copyFrom(direction);
                                avatar.updateRotation();
                                result.log = this._isDebug ? `MOVE USER: #${result.userId} (${position.x}, ${position.y}, ${position.z})` : undefined;
                                result.category = Hepzi.ClientCategory.Debug;
                            }
                            else {
                                result.log = this._isDebug ? `MOVE SELF NO-OP: (${position.x}, ${position.y}, ${position.z})` : undefined;
                                result.category = Hepzi.ClientCategory.Debug;
                            }
                        }
                        else {
                            result.log = `MOVE USER: cannot find user #${result.userId}`;
                            result.category = Hepzi.ClientCategory.Error;
                        }
                        break;
                    default:
                        const hex = buffer.getHex();
                        result.log = `UNKNOWN RESPONSE TYPE: ${result.responseType} => ${hex}`;
                        result.message = `Unknown response of type ${result.responseType} and body ${hex}`;
                        result.category = Hepzi.ClientCategory.Error;
                        break;
                }
            }
            return result;
        }
    }
    Hepzi.ClientResponseParser = ClientResponseParser;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class EventEmitter {
        constructor() {
            this._callbacks = {};
        }
        emit(key, data) {
            const callbacks = (this._callbacks[key] || []).slice();
            callbacks.forEach(callback => callback(data));
        }
        off(eventName, callback) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).filter(c => c !== callback);
        }
        on(eventName, callback) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).concat(callback);
        }
    }
    Hepzi.EventEmitter = EventEmitter;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class WebSocketClient extends Hepzi.EventEmitter {
        constructor(options) {
            options = options || {};
            super();
            this._address = options.address || `${window.location.hostname}:${window.location.port}`;
            this._binaryType = options.binaryType || 'arraybuffer';
            this._isDebug = !!(options.isDebug);
            this._path = ((options.path === undefined || options.path === null) ? 'client' : options.path).replace(/^\//, '');
            this._socket = null;
            this._sessionId = null;
            this._userId = null;
        }
        connect(userId, sessionId) {
            if (this._socket) {
                throw Error('Connect attempted while socket already connected.');
            }
            if (!userId || !sessionId) {
                throw Error('Both userId and sessionId must be supplied for connect().');
            }
            const socketUrl = `wss://${this._address}/${this._path}`;
            const socket = new WebSocket(socketUrl);
            const self = this;
            if (this._binaryType) {
                socket.binaryType = this._binaryType;
            }
            socket.onclose = (event) => self.emitExtended('close', event, socket, self.disconnect.bind(this));
            socket.onerror = (event) => self.emitExtended('error', event, socket, self.disconnect.bind(this));
            socket.onmessage = (event) => self.emitExtended('message', event, socket);
            socket.onopen = (event) => self.emitExtended('open', event, socket, self.onOpen.bind(this));
            this._socket = socket;
            this._sessionId = sessionId;
            this._userId = userId;
        }
        disconnect() {
            const socket = this._socket;
            this._socket = null;
            if (socket) {
                if (this._isDebug) {
                    console.debug('Disconnect of web-socket requested by local application.');
                }
                socket.close();
            }
            else if (this._isDebug) {
                console.debug('Disconnect of non-open web-socket requested by local application: ignored.');
            }
        }
        emitExtended(eventName, event, socket, callback) {
            if (socket && socket === this._socket) {
                if (this._isDebug && callback) {
                    console.debug(`"${eventName}" event raised for current web-socket: running direct callback.`);
                }
                callback === null || callback === void 0 ? void 0 : callback();
                if (this._isDebug) {
                    console.debug(`Emitting "${eventName}" event from socket.`);
                }
                this.emit(eventName, event);
            }
            else if (this._isDebug) {
                console.debug(`"${eventName}" event raised for non-current web-socket: ignored.`);
            }
        }
        onOpen() {
            if (!this._sessionId || !this._userId) {
                throw Error(`Invalid state on open`);
            }
            else {
                if (this._isDebug) {
                    console.debug(`Connecting userId ${this._userId} to session ${this._sessionId}`);
                }
                const buffer = new ArrayBuffer(8);
                const writer = new Hepzi.ArrayBufferWrapper(buffer);
                writer.putInteger(this._userId);
                writer.putInteger(this._sessionId);
                if (this._isDebug) {
                    console.debug(`Received message from client: ${buffer}`);
                }
                this.send(buffer);
            }
        }
        send(message) {
            let result = false;
            try {
                if (this._socket) {
                    if (this._isDebug) {
                        console.debug(`Sending [${message}] to connected client.`);
                    }
                    this._socket.send(message);
                    result = true;
                }
                else if (this._isDebug) {
                    console.debug('Send on non-open socket: ignored.');
                }
            }
            catch (error) {
                console.error(`Error during send on websocket: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
            return result;
        }
    }
    Hepzi.WebSocketClient = WebSocketClient;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class HepziModel {
    }
    class GuiClient {
        constructor(factory, canvasName) {
            this._renderLoop = null;
            const canvas = canvasName ? document.getElementById(canvasName) : null;
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
        addAvatar(avatar) {
            const scene = this._scene;
            if (scene) {
                const material = new BABYLON.StandardMaterial('material', scene);
                material.alpha = 1;
                material.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);
                const mesh = BABYLON.Mesh.CreateHemisphere(`avatar:${avatar.name}`, 16, 2, scene);
                mesh.position = avatar.position;
                mesh.material = material;
                (mesh.hepziModel = new HepziModel()).avatar = avatar;
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
        addKeyboardHandler() {
            const self = this;
            const scene = this._scene;
            scene === null || scene === void 0 ? void 0 : scene.onKeyboardObservable.add((kbInfo) => {
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
        addMouseHandler() {
            const self = this;
            const scene = this._scene;
            scene === null || scene === void 0 ? void 0 : scene.onPointerObservable.add((pointerInfo) => {
                var _a, _b, _c;
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
                            const avatar = (_c = (_b = (_a = pointerInfo.pickInfo) === null || _a === void 0 ? void 0 : _a.pickedMesh) === null || _b === void 0 ? void 0 : _b.hepziModel) === null || _c === void 0 ? void 0 : _c.avatar;
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
        createScene() {
            if (this._isDebug) {
                console.log('CREATING SCENE');
            }
            if (this._scene) {
                throw Error('Cannot create scene: already created.');
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
        onMouseLeave() {
            console.log('MouseLeave');
        }
        removeAvatar(avatar) {
            var _a, _b;
            const model = (_a = avatar.mesh) === null || _a === void 0 ? void 0 : _a.hepziModel;
            if (this._scene && model) {
                avatar.mesh.hepziModel = null;
                (_b = avatar.mesh) === null || _b === void 0 ? void 0 : _b.dispose();
            }
            avatar.mesh = null;
        }
        setRotation(avatar) {
            if (avatar.mesh) {
                if (!(avatar.direction.x || avatar.direction.y || avatar.direction.z)) {
                    avatar.direction.x = 1;
                }
                const rotationQuaternion = BABYLON.Quaternion.FromEulerVector(avatar.direction.normalize());
                avatar.mesh.rotationQuaternion = rotationQuaternion;
            }
        }
        startRun() {
            const self = this;
            const scene = self._scene;
            if (!scene) {
                throw Error('Cannot start render-loop: scene is not initialised.');
            }
            if (this._renderLoop) {
                throw Error('Cannot start render-loop: already running.');
            }
            this._renderLoop = () => { if (scene == self._scene) {
                scene.render();
            } };
            this._engine.runRenderLoop(this._renderLoop);
        }
        stopRun() {
            var _a;
            if (this._renderLoop) {
                if (this._isDebug) {
                    console.log('STOPPING RENDER');
                }
                this._engine.stopRenderLoop(this._renderLoop);
                this._renderLoop = null;
                (_a = this._scene) === null || _a === void 0 ? void 0 : _a.dispose();
                this._scene = null;
                this._avatar = null;
                this._camera = null;
                console.log('RENDER STOPPED');
            }
            else {
                console.log('WARN: render-loop is not running so cannot be stopped.');
            }
        }
    }
    Hepzi.GuiClient = GuiClient;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ApplicationClient extends Hepzi.EventEmitter {
        constructor(factory, userId) {
            super();
            this._avatar = null;
            this._updateTimerHandle = null;
            this._avatars = {};
            this._userId = userId;
            this._commandInterpreter = factory.createClientCommandInterpreter();
            this._gui = factory.createGuiClient('canvas');
            this._isDebug = factory.isDebug('ApplicationClient');
            this._responseParser = factory.createClientResponseParser();
            this._socket = factory.createWebSocketClient();
            const self = this;
            this._socket.on('open', () => self.onConnecting());
            this._socket.on('close', () => self.emit('close', self));
            this._socket.on('error', () => self.emit('error', self));
            this._socket.on('message', (event) => self.onClientMessageReceived(event));
        }
        connect(sessionId) {
            if (this._isDebug) {
                console.log('CONNECTING');
            }
            this._socket.connect(this._userId, sessionId);
        }
        disconnect() {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient disconnecting if connected.`);
            }
            this._avatar = null;
            this._socket.disconnect();
            if (this._gui) {
                this._gui.stopRun();
            }
        }
        interpretCommand(command) {
            if (command) {
                const result = this._commandInterpreter.interpretCommand(this._userId, command, this._avatars);
                if (result.log && this._isDebug) {
                    console.log(result.log);
                }
                if (result.message && (this._isDebug || (result.category !== Hepzi.ClientCategory.Debug && result.category !== Hepzi.ClientCategory.Error))) {
                    ((typeof result.message === 'string' || result.message instanceof String) ? [result.message] : result.message)
                        .forEach(message => this.emit('message', {
                        text: message,
                        colour: result.category == Hepzi.ClientCategory.Error ? 'text-danger' : 'text-secondary'
                    }));
                }
                if (result.buffer) {
                    this.send(result.buffer);
                }
                if (result.isTerminal) {
                    this.emit('close', null);
                }
            }
        }
        onClientMessageReceived(event) {
            if (event && event.data) {
                const result = this._responseParser.parseResponse(this._userId, event.data, this._avatars);
                if (result.log && this._isDebug) {
                    console.log(result.log);
                }
                if (result.message && (this._isDebug || (result.category !== Hepzi.ClientCategory.Debug &&
                    result.category !== Hepzi.ClientCategory.Error))) {
                    this.emit('message', { text: result.message, colour: result.determineTextColourClass() });
                }
                if (result.category !== Hepzi.ClientCategory.Error) {
                    if (result.avatar != null) {
                        switch (result.responseType) {
                            case Hepzi.ClientResponseType.AddInstanceSession:
                            case Hepzi.ClientResponseType.InitialInstanceSession:
                                if (this._avatar) {
                                    this._gui.addAvatar(result.avatar);
                                }
                                else if (result.avatar.isSelf) {
                                    this._gui.createScene();
                                    for (const key in this._avatars) {
                                        const avatar = this._avatars[parseInt(key)];
                                        this._gui.addAvatar(avatar);
                                    }
                                    if (this._updateTimerHandle) {
                                        window.clearInterval(this._updateTimerHandle);
                                        this._updateTimerHandle = null;
                                    }
                                    const self = this;
                                    this._avatar = result.avatar;
                                    this._updateTimerHandle = window.setInterval(() => self.onUpdateTimer(), 10);
                                    this._gui.startRun();
                                }
                                break;
                            case Hepzi.ClientResponseType.RemoveInstanceSession:
                                this._gui.removeAvatar(result.avatar);
                                break;
                        }
                    }
                }
                if (result.isTerminal) {
                    const self = this;
                    this.disconnect();
                    window.setTimeout(() => self.emit('close', null), 2500);
                }
            }
        }
        onConnecting() {
            if (this._isDebug) {
                console.log('CONNECTED');
            }
            Object.keys(this._avatars).forEach(userId => delete this._avatars[parseInt(userId)]);
        }
        send(buffer) {
            if (this._isDebug) {
                console.log(`SEND array-buffer of size ${new Hepzi.ArrayBufferWrapper(buffer).length}`);
            }
            this._socket.send(buffer);
        }
        onUpdateTimer() {
            if (this._socket && this._avatar) {
                if (this._avatar.hasPositionOrDirectionChanged()) {
                    this._avatar.updateLastPositionAndDirection();
                    this.send(Hepzi.ClientCommandBuilder.MoveClient(this._avatar));
                }
            }
        }
    }
    Hepzi.ApplicationClient = ApplicationClient;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class Factory {
        constructor() {
            this._debugClasses = {};
        }
        createApplicationClient(userId) { return new Hepzi.ApplicationClient(this, userId); }
        createClientCommandInterpreter() { return new Hepzi.ClientCommandInterpreter(); }
        createClientResponseParser() { return new Hepzi.ClientResponseParser(this); }
        createGuiClient(canvasName) { return new Hepzi.GuiClient(this, canvasName); }
        createWebSocketClient(options) { return new Hepzi.WebSocketClient(Object.assign(Object.assign({}, options), { isDebug: this.isDebug('WebSocketClient') || (options === null || options === void 0 ? void 0 : options.isDebug) })); }
        debug(className) { this._debugClasses[className] = true; }
        isDebug(className) { return !!this._debugClasses[className]; }
    }
    Factory.instance = new Factory();
    Hepzi.Factory = Factory;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientCommand {
        constructor(command) {
            this.category = Hepzi.ClientCategory.Normal;
            this.isTerminal = false;
            this.command = command;
        }
    }
    Hepzi.ClientCommand = ClientCommand;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientResponse {
        constructor(responseType) {
            this.isTerminal = false;
            this.responseType = responseType;
            this.category = Hepzi.ClientCategory.Normal;
        }
        determineTextColourClass() {
            let colour;
            switch (this.category) {
                case Hepzi.ClientCategory.Debug:
                    colour = 'text-secondary';
                    break;
                case Hepzi.ClientCategory.Error:
                case Hepzi.ClientCategory.System:
                    colour = 'text-danger';
                    break;
                case Hepzi.ClientCategory.Important:
                    colour = 'text-primary';
                    break;
                default:
                    colour = 'text-success';
                    break;
            }
            return colour;
        }
    }
    Hepzi.ClientResponse = ClientResponse;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class FreeCameraKeyboardWalkInput {
        constructor() {
            this.angularSpeed = 0.1;
            this.camera = null;
            this.direction = new BABYLON.Vector3();
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
            this._onKeyDown = null;
            this._onKeyUp = null;
            this._keys = [];
            this.keysUp = [38];
            this.keysDown = [40];
            this.keysLeft = [37];
            this.keysRight = [39];
        }
        attachControl(noPreventDefault) {
            var _a;
            var element = (_a = this.camera) === null || _a === void 0 ? void 0 : _a.getEngine().getInputElement();
            if (element && !this._onKeyDown) {
                var self = this;
                element.tabIndex = 1;
                this._onKeyDown = function (event) {
                    if (self.keysUp.indexOf(event.keyCode) !== -1 ||
                        self.keysDown.indexOf(event.keyCode) !== -1 ||
                        self.keysLeft.indexOf(event.keyCode) !== -1 ||
                        self.keysRight.indexOf(event.keyCode) !== -1) {
                        var index = self._keys.indexOf(event.keyCode);
                        if (index === -1) {
                            self._keys.push(event.keyCode);
                        }
                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
                    }
                };
                this._onKeyUp = function (event) {
                    if (self.keysUp.indexOf(event.keyCode) !== -1 ||
                        self.keysDown.indexOf(event.keyCode) !== -1 ||
                        self.keysLeft.indexOf(event.keyCode) !== -1 ||
                        self.keysRight.indexOf(event.keyCode) !== -1) {
                        var index = self._keys.indexOf(event.keyCode);
                        if (index >= 0) {
                            self._keys.splice(index, 1);
                        }
                        if (!noPreventDefault) {
                            event.preventDefault();
                        }
                    }
                };
                element.addEventListener("keydown", this._onKeyDown, false);
                element.addEventListener("keyup", this._onKeyUp, false);
            }
        }
        checkInputs() {
            const camera = this.camera;
            if (camera && this._onKeyDown) {
                for (var index = 0; index < this._keys.length; index++) {
                    var keyCode = this._keys[index];
                    var speed = camera.speed;
                    if (this.keysLeft.indexOf(keyCode) !== -1) {
                        camera.rotation.y -= this.angularSpeed;
                        this.direction.copyFromFloats(0, 0, 0);
                    }
                    else if (this.keysUp.indexOf(keyCode) !== -1) {
                        this.direction.copyFromFloats(0, 0, speed);
                    }
                    else if (this.keysRight.indexOf(keyCode) !== -1) {
                        camera.rotation.y += this.angularSpeed;
                        this.direction.copyFromFloats(0, 0, 0);
                    }
                    else if (this.keysDown.indexOf(keyCode) !== -1) {
                        this.direction.copyFromFloats(0, 0, -speed);
                    }
                    if (camera.getScene().useRightHandedSystem) {
                        this.direction.z *= -1;
                    }
                    camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);
                    BABYLON.Vector3.TransformNormalToRef(this.direction, camera._cameraTransformMatrix, camera._transformedDirection);
                    camera.cameraDirection.addInPlace(camera._transformedDirection);
                }
            }
        }
        detachControl() {
            var _a;
            var element = (_a = this.camera) === null || _a === void 0 ? void 0 : _a.getEngine().getInputElement();
            if (element && this._onKeyDown && this._onKeyUp) {
                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);
                BABYLON.Tools.UnregisterTopRootEvents(window, [
                    { name: "blur", handler: this._onLostFocus }
                ]);
                this._keys = [];
                this._onKeyDown = null;
                this._onKeyUp = null;
            }
        }
        getClassName() { return 'FreeCameraKeyboardWalkInput'; }
        getSimpleName() { return 'keyboard'; }
        _onLostFocus(_event) { this._keys = []; }
    }
    Hepzi.FreeCameraKeyboardWalkInput = FreeCameraKeyboardWalkInput;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class FreeCameraSearchInput {
        constructor(touchEnabled) {
            this.camera = null;
            this._observer = null;
            this.previousPosition = null;
            this._onSearchMove = null;
            this._pointerInput = null;
            if (touchEnabled === void 0) {
                touchEnabled = true;
            }
            this.touchEnabled = touchEnabled;
            this.angularSensibility = 2000.0;
            this.buttons = [0, 1, 2];
            this.restrictionX = 100;
            this.restrictionY = 60;
        }
        attachControl(noPreventDefault) {
            const self = this;
            const camera = self.camera;
            const engine = camera === null || camera === void 0 ? void 0 : camera.getEngine();
            const element = engine === null || engine === void 0 ? void 0 : engine.getInputElement();
            if (camera && engine && element && !this._pointerInput) {
                const angle = { x: 0, y: 0 };
                this._pointerInput = function (pointerInfo, _) {
                    const type = pointerInfo.type;
                    const event = pointerInfo.event;
                    if (!self.touchEnabled && event.pointerType === "touch") {
                        return;
                    }
                    if (type !== BABYLON.PointerEventTypes.POINTERMOVE && self.buttons.indexOf(event.button) === -1) {
                        return;
                    }
                    switch (type) {
                        case BABYLON.PointerEventTypes.POINTERDOWN:
                            try {
                                event.srcElement.setPointerCapture(event.pointerId);
                            }
                            catch (_) { }
                            self.previousPosition = { x: event.clientX, y: event.clientY };
                            if (!noPreventDefault) {
                                event.preventDefault();
                                element.focus();
                            }
                            break;
                        case BABYLON.PointerEventTypes.POINTERUP:
                            try {
                                event.srcElement.releasePointerCapture(event.pointerId);
                            }
                            catch (_) { }
                            self.previousPosition = null;
                            if (!noPreventDefault) {
                                event.preventDefault();
                            }
                            break;
                        case BABYLON.PointerEventTypes.POINTERMOVE:
                            if (!self.previousPosition || engine.isPointerLock) {
                                return;
                            }
                            var offsetX = event.clientX - self.previousPosition.x;
                            var offsetY = event.clientY - self.previousPosition.y;
                            angle.x += offsetX;
                            angle.y -= offsetY;
                            if (Math.abs(angle.x) > self.restrictionX) {
                                angle.x -= offsetX;
                            }
                            if (Math.abs(angle.y) > self.restrictionY) {
                                angle.y += offsetY;
                            }
                            if (camera.getScene().useRightHandedSystem) {
                                if (Math.abs(angle.x) < self.restrictionX) {
                                    camera.cameraRotation.y -= offsetX / self.angularSensibility;
                                }
                            }
                            else if (Math.abs(angle.x) < self.restrictionX) {
                                camera.cameraRotation.y += offsetX / self.angularSensibility;
                            }
                            if (Math.abs(angle.y) < self.restrictionY) {
                                camera.cameraRotation.x += offsetY / self.angularSensibility;
                            }
                            self.previousPosition = { x: event.clientX, y: event.clientY };
                            if (!noPreventDefault) {
                                event.preventDefault();
                            }
                            break;
                    }
                };
                this._onSearchMove = function (event) {
                    if (!engine.isPointerLock) {
                        return;
                    }
                    var offsetX = event.movementX || event.mozMovementX || event.webkitMovementX || event.msMovementX || 0;
                    var offsetY = event.movementY || event.mozMovementY || event.webkitMovementY || event.msMovementY || 0;
                    if (camera.getScene().useRightHandedSystem) {
                        camera.cameraRotation.y -= offsetX / self.angularSensibility;
                    }
                    else {
                        camera.cameraRotation.y += offsetX / self.angularSensibility;
                    }
                    camera.cameraRotation.x += offsetY / self.angularSensibility;
                    self.previousPosition = null;
                    if (!noPreventDefault) {
                        event.preventDefault();
                    }
                };
                this._observer = camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
                element.addEventListener("mousemove", this._onSearchMove, false);
            }
        }
        checkInputs() {
        }
        detachControl() {
            var _a;
            const element = (_a = this.camera) === null || _a === void 0 ? void 0 : _a.getEngine().getInputElement();
            if (element && this.camera && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                if (this._onSearchMove) {
                    element.removeEventListener("mousemove", this._onSearchMove);
                }
                this._observer = null;
                this._onSearchMove = null;
                this.previousPosition = null;
            }
        }
        getClassName() { return 'FreeCameraSearchInput'; }
        getSimpleName() { return 'MouseSearchCamera'; }
    }
    Hepzi.FreeCameraSearchInput = FreeCameraSearchInput;
})(Hepzi || (Hepzi = {}));
//# sourceMappingURL=hepzi.js.map