var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
System.register("webSocketClient", [], function (exports_1, context_1) {
    'use strict';
    var WebSocketClient;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            WebSocketClient = class WebSocketClient extends EventTarget {
                constructor(options) {
                    super();
                    this.address = options.address || `${window.location.hostname}:${window.location.port}`;
                    this.isDebug = !!(options === null || options === void 0 ? void 0 : options.isDebug);
                    this.socket = null;
                    this.token = null;
                }
                connect() {
                    if (this.socket) {
                        throw Error('Connect attempted while socket already connected.');
                    }
                    const socketUrl = `wss://${this.address}/client`;
                    const socket = new WebSocket(socketUrl);
                    const self = this;
                    socket.onclose = (event) => self.onEvent('close', event, socket);
                    socket.onerror = (event) => self.onEvent('error', event, socket);
                    socket.onmessage = (event) => self.onEvent('message', event, socket);
                    socket.onopen = (event) => self.onEvent('open', event, socket, self.onOpen);
                    this.socket = socket;
                }
                login(username, password) {
                    var _a;
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            if (this.socket) {
                                this.logout();
                            }
                            const response = yield this.sendHttp('login', {
                                Username: username,
                                Password: password
                            });
                            if (response.isError || !response.data || !response.data.loginToken) {
                                console.info(`Login failure: ${response.data}`);
                                return false;
                            }
                            else {
                                console.debug(`Login success yielded: ${JSON.stringify(response.data)}: opening channel.`);
                                this.token = response.data.loginToken;
                                this.connect();
                                return true;
                            }
                        }
                        catch (error) {
                            console.log(`Login exception: ${(_a = error) === null || _a === void 0 ? void 0 : _a.message}`);
                            return false;
                        }
                    });
                }
                logout() {
                    const socket = this.socket;
                    this.socket = null;
                    this.token = null;
                    if (socket) {
                        if (this.isDebug) {
                            console.debug('Disconnect of web-socket requested by local application.');
                        }
                        socket.close();
                    }
                    else if (this.isDebug) {
                        console.debug('Disconnect of non-open web-socket requested by local application: ignored.');
                    }
                }
                onEvent(type, event, socket, callback) {
                    if (socket && socket === this.socket) {
                        if (this.isDebug) {
                            console.debug(`"${type}" event raised for current web-socket: re-raised as ${type} on client.`);
                        }
                        callback === null || callback === void 0 ? void 0 : callback();
                        this.dispatchEvent(new CustomEvent(type, { detail: { event: event } }));
                    }
                    else if (this.isDebug) {
                        console.debug(`"${type}" event raised for non-current web-socket: ignored.`);
                    }
                }
                onOpen() {
                    if (this.token) {
                        if (this.isDebug) {
                            console.debug(`Sending login token: ${this.token}`);
                        }
                        this.send(this.token);
                    }
                    else {
                        throw Error(`Token is null after connect.`);
                    }
                }
                send(message) {
                    if (this.socket) {
                        if (this.isDebug) {
                            console.debug(`Sending [${message}] to connected client.`);
                        }
                        this.socket.send(message);
                    }
                    else if (this.isDebug) {
                        console.debug('Send on non-open socket: ignored.');
                    }
                }
                sendHttp(url, body) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const result = yield fetch(url, {
                            method: body ? 'POST' : 'GET',
                            headers: { 'Content-Type': 'application/json' },
                            body: body ? JSON.stringify(body) : null
                        })
                            .then(response => {
                            var _a;
                            if (response.status >= 200 || response.status <= 299) {
                                if (this.isDebug) {
                                    console.debug(`Login succeeded with status-code: ${response.status}`);
                                }
                                return response.json();
                            }
                            else if (response.status === 401) {
                                console.warn('Login failed: bad username or password.');
                                throw Error('LoginFailure::BadCredentials');
                            }
                            throw Error(((_a = response.status) === null || _a === void 0 ? void 0 : _a.toString()) || 'Call failed');
                        })
                            .then(json => ({ data: json, isError: false }))
                            .catch(error => ({ data: error.message, isError: true }));
                        return result || { data: 'Unknown error', isError: true };
                    });
                }
            };
            exports_1("WebSocketClient", WebSocketClient);
        }
    };
});
//# sourceMappingURL=hepzi.js.map