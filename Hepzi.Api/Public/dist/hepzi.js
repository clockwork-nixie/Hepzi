"use strict";
var Hepzi;
(function (Hepzi) {
    class ArrayBufferWrapper {
        constructor(buffer) {
            this._buffer = new Uint8Array(buffer);
            this.length = buffer.byteLength;
            this._position = 0;
        }
        static calculateBytes(text) { return new Blob([text]).size; }
        getByte() {
            if (this._position >= this._buffer.length) {
                throw Error(`Buffer overrun reading byte ${this._position + 1} of ${this._buffer.length}`);
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
            return [...this._buffer].slice(this._position, length ? this._position + length : length)
                .map(x => ('0' + x.toString(16)).slice(-2)).join('');
        }
        getString(length) {
            return ArrayBufferWrapper._decoder
                .decode(this._buffer.slice(this._position, length ? this._position + length : length));
        }
        position() { return this._position; }
        ;
        putByte(value) {
            if (this._position >= this._buffer.length) {
                throw Error(`Buffer overrun writing byte ${this._position + 1} of ${this._buffer.length}`);
            }
            this._buffer[this._position++] = value & 0xFF;
        }
        putByteArray(buffer) {
            this._buffer.set(new Uint8Array(buffer), this._position);
            this._position += buffer.byteLength;
        }
        putInteger(value) {
            for (let i = 3; i >= 0; --i) {
                this.putByte(value >> (8 * i));
            }
        }
        putString(text) {
            const data = ArrayBufferWrapper._encoder.encode(text);
            this._buffer.set(data, 0);
            this._position += data === null || data === void 0 ? void 0 : data.length;
        }
    }
    ArrayBufferWrapper._decoder = new TextDecoder();
    ArrayBufferWrapper._encoder = new TextEncoder();
    Hepzi.ArrayBufferWrapper = ArrayBufferWrapper;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientCommandInterpreter {
        interpretCommand(userId, request, users) {
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
                                result.message = `Syntax should be: ${command} <username>`;
                                result.category = Hepzi.ClientCategory.Error;
                            }
                            else {
                                const username = words[1];
                                const targetUserId = this.getUserIdByUsername(username, users);
                                if (targetUserId) {
                                    const buffer = new ArrayBuffer(5);
                                    const writer = new Hepzi.ArrayBufferWrapper(buffer);
                                    writer.putByte(result.command);
                                    writer.putInteger(targetUserId);
                                    result.buffer = buffer;
                                    result.log = `SEND KICK #${userId}`;
                                    result.message = `${command} ${username}`;
                                }
                                else {
                                    result.message = `Cannot kick unknown user: ${username}`;
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
                            result.message = [`${command}`].concat(Object.keys(users).map(userId => `\u2022 ${users[parseInt(userId)]}`));
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
        getUserIdByUsername(username, users) {
            username = username.toLowerCase();
            return parseInt(Object.keys(users).filter(userId => { var _a; return ((_a = users[parseInt(userId)]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) == username; })[0]) || null;
        }
    }
    Hepzi.ClientCommandInterpreter = ClientCommandInterpreter;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ClientResponseParser {
        parseResponse(userId, response, users) {
            let result;
            try {
                if (response instanceof ArrayBuffer) {
                    result = this.parseBinaryResponse(userId, new Hepzi.ArrayBufferWrapper(response), users);
                }
                else if (typeof response === 'string' || response instanceof String) {
                    result = new Hepzi.ClientResponse(Hepzi.ClientResponseType.InstanceMessage);
                    result.log = `SYSTEM MESSAGE: ${response}`;
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
        parseBinaryResponse(userId, buffer, users) {
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
                        result.log = 'CONNECTED';
                        result.message = 'Connected to instance.';
                        break;
                    case Hepzi.ClientResponseType.Heartbeat:
                        result.log = 'HEARTBEAT';
                        result.message = 'Heatbeat from instance.';
                        result.category = Hepzi.ClientCategory.Debug;
                        break;
                    case Hepzi.ClientResponseType.InitialInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = buffer.getString();
                        result.log = `INITIAL USER: #${result.userId} => ${result.username}`;
                        result.message = `${result.username} is already here.`;
                        users[result.userId] = result.username;
                        break;
                    case Hepzi.ClientResponseType.AddInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = buffer.getString();
                        result.log = `ADD USER: #${result.userId} => ${result.username}`;
                        result.message = result.userId == userId ?
                            `You have joined the area.` :
                            `${result.username} has joined the area.`;
                        result.category = Hepzi.ClientCategory.Important;
                        users[result.userId] = result.username;
                        break;
                    case Hepzi.ClientResponseType.RemoveInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = users[result.userId] || `User#${result.userId}`;
                        result.log = `REMOVE USER: #${result.userId}`;
                        result.message = `${result.username} has left the area.`;
                        result.category = Hepzi.ClientCategory.Important;
                        delete users[result.userId];
                        break;
                    case Hepzi.ClientResponseType.InstanceMessage:
                        const text = buffer.getString();
                        result.log = `INSTANCE MESSAGE: ${text}`;
                        result.message = `**** ${text} ****`;
                        result.category = Hepzi.ClientCategory.System;
                        break;
                    case Hepzi.ClientResponseType.KickClient:
                        result.log = 'KICKED';
                        result.message = `Your session has been terminated.`;
                        result.category = Hepzi.ClientCategory.System;
                        result.isTerminal = true;
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
        on(eventName, callback) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).concat(callback);
        }
        off(eventName, callback) {
            this._callbacks[eventName] = (this._callbacks[eventName] || []).filter(c => c !== callback);
        }
    }
    Hepzi.EventEmitter = EventEmitter;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    class ApplicationClient extends Hepzi.EventEmitter {
        constructor(userId, socket, options) {
            var _a;
            if (!socket) {
                throw Error("ApplicationClient requires a web-socket client argument.");
            }
            super();
            options = options || {};
            this._commandInterpreter = new Hepzi.ClientCommandInterpreter();
            this._isDebug = (_a = options.isDebug) !== null && _a !== void 0 ? _a : false;
            this._responseParser = new Hepzi.ClientResponseParser();
            this._socket = socket;
            this._userId = userId;
            this._users = {};
            const self = this;
            this._socket.on('open', () => self.onConnecting());
            this._socket.on('close', () => { self.onClose(); this.emit('close', this); });
            this._socket.on('error', () => { self.onClose(); this.emit('error', this); });
            this._socket.on('message', (event) => self.onClientMessageReceived(event));
        }
        connect(sessionId) {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient connecting.`);
            }
            this._socket.connect(this._userId, sessionId);
        }
        disconnect() {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient disconnecting if connected.`);
            }
            this._socket.disconnect();
        }
        interpretCommand(command) {
            if (command) {
                const result = this._commandInterpreter.interpretCommand(this._userId, command, this._users);
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
                const result = this._responseParser.parseResponse(this._userId, event.data, this._users);
                if (result.log && this._isDebug) {
                    console.log(result.log);
                }
                if (result.message && (this._isDebug || (result.category !== Hepzi.ClientCategory.Debug &&
                    result.category !== Hepzi.ClientCategory.Error))) {
                    this.emit('message', { text: result.message, colour: result.determineTextColourClass() });
                }
                if (result.isTerminal) {
                    const self = this;
                    this.disconnect();
                    window.setTimeout(() => self.emit('kicked', null), 2500);
                }
            }
        }
        onClose() {
            if (this._isDebug) {
                console.log('CLOSING');
            }
        }
        onConnecting() {
            if (this._isDebug) {
                console.log('CONNECTING');
            }
            this._users = {};
        }
        send(buffer) {
            if (this._isDebug) {
                console.log(`DEBUG: ApplicationClient sending array-buffer of size ${new Hepzi.ArrayBufferWrapper(buffer).length}`);
            }
            this._socket.send(buffer);
        }
    }
    Hepzi.ApplicationClient = ApplicationClient;
})(Hepzi || (Hepzi = {}));
var Hepzi;
(function (Hepzi) {
    let ClientCategory;
    (function (ClientCategory) {
        ClientCategory[ClientCategory["Debug"] = 0] = "Debug";
        ClientCategory[ClientCategory["Normal"] = 1] = "Normal";
        ClientCategory[ClientCategory["Important"] = 2] = "Important";
        ClientCategory[ClientCategory["Urgent"] = 3] = "Urgent";
        ClientCategory[ClientCategory["System"] = 4] = "System";
        ClientCategory[ClientCategory["Error"] = 5] = "Error";
    })(ClientCategory = Hepzi.ClientCategory || (Hepzi.ClientCategory = {}));
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
    let ClientRequestType;
    (function (ClientRequestType) {
        ClientRequestType[ClientRequestType["Unknown"] = 0] = "Unknown";
        ClientRequestType[ClientRequestType["InstanceMessage"] = 1] = "InstanceMessage";
        ClientRequestType[ClientRequestType["KickClient"] = 2] = "KickClient";
    })(ClientRequestType = Hepzi.ClientRequestType || (Hepzi.ClientRequestType = {}));
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
    })(ClientResponseType = Hepzi.ClientResponseType || (Hepzi.ClientResponseType = {}));
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
            const socketUrl = `wss://${this._address}/client`;
            const socket = new WebSocket(socketUrl);
            const self = this;
            if (this._binaryType) {
                socket.binaryType = this._binaryType;
            }
            socket.onclose = (event) => self.emitExtended('close', event, socket, () => self.disconnect());
            socket.onerror = (event) => self.emitExtended('error', event, socket, () => self.disconnect());
            socket.onmessage = (event) => self.emitExtended('message', event, socket);
            socket.onopen = (event) => self.emitExtended('open', event, socket, () => self.onOpen());
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
                    console.log(`Received message from client: ${buffer}`);
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
                console.log(`Error during send on websocket: ${(error === null || error === void 0 ? void 0 : error.message) || error}`);
            }
            return result;
        }
    }
    Hepzi.WebSocketClient = WebSocketClient;
})(Hepzi || (Hepzi = {}));
//# sourceMappingURL=hepzi.js.map