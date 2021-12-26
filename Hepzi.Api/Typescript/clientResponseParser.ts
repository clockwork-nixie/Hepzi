﻿/// <reference path="arrayBufferWrapper.ts" />

namespace Hepzi {
    export class ClientResponseParser {
        public parseResponse(userId: number, response: any, users: { [index: number]: string }): ClientResponse {
            let result: ClientResponse;

            try {
                if (response instanceof ArrayBuffer) {
                    result = this.parseBinaryResponse(userId, new ArrayBufferWrapper(response as ArrayBuffer), users);
                } else if (typeof response === 'string' || response instanceof String) {
                    result = new ClientResponse(ClientResponseType.InstanceMessage);
                    result.log = `SYSTEM MESSAGE: ${response}`;
                    result.message = `**** ${response} ****`;
                    result.category = ClientCategory.System;
                } else {
                    result = new ClientResponse(ClientResponseType.Unknown);
                    result.log = `UNKNOWN RESPONSE MESSAGE TYPE: ${typeof response}: ${response}`;
                    result.message = `Unknown response message ${typeof response}: ${response}`;
                    result.category = ClientCategory.Error;
                }
            } catch (error) {
                result = new ClientResponse(ClientResponseType.Unknown);
                result.log = `ERROR parsing client response: ${error}`;
                result.message = `Error parsing client response: ${error}`;
                result.category = ClientCategory.Error;
            }

            return result;
        }


        private parseBinaryResponse(userId: number, buffer: ArrayBufferWrapper, users: { [index: number]: string }): ClientResponse {
            let result: ClientResponse;

            if (buffer.length <= 0) {
                result = new ClientResponse(ClientResponseType.Unknown);
                result.message = "Empty binary message received from server";
                result.category = ClientCategory.Debug;
            } else {
                result = new ClientResponse(buffer.getByte());

                switch (result.responseType) {
                    case ClientResponseType.Welcome:
                        result.log = 'CONNECTED';
                        result.message = 'Connected to instance.';
                        break;

                    case ClientResponseType.Heartbeat:
                        result.log = 'HEARTBEAT';
                        result.message = 'Heatbeat from instance.';
                        result.category = ClientCategory.Debug;
                        break;

                    case ClientResponseType.InitialInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = buffer.getString();
                        result.log = `INITIAL USER: #${result.userId} => ${result.username}`;
                        result.message = `${result.username} is already here.`;
                        users[result.userId] = result.username;
                        break;

                    case ClientResponseType.AddInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = buffer.getString();
                        result.log = `ADD USER: #${result.userId} => ${result.username}`;
                        result.message = result.userId == userId ?
                            `You have joined the area.`:
                            `${result.username} has joined the area.`;
                        result.category = ClientCategory.Important;
                        users[result.userId] = result.username;
                        break;

                    case ClientResponseType.RemoveInstanceSession:
                        result.userId = buffer.getInteger();
                        result.username = users[result.userId] || `User#${result.userId}`
                        result.log = `REMOVE USER: #${result.userId}`;
                        result.message = `${result.username} has left the area.`;
                        result.category = ClientCategory.Important;
                        delete users[result.userId];
                        break;

                    case ClientResponseType.InstanceMessage:
                        const text = buffer.getString();
                        result.log = `INSTANCE MESSAGE: ${text}`;
                        result.message = `**** ${text} ****`;
                        result.category = ClientCategory.System;
                        break;

                    case ClientResponseType.KickClient:
                        result.log = 'KICKED';
                        result.message = `Your session has been terminated.`;
                        result.category = ClientCategory.System;
                        result.isTerminal = true;
                        break;

                    default:
                        const hex = buffer.getHex();
                        result.log = `UNKNOWN RESPONSE TYPE: ${result.responseType} => ${hex}`;
                        result.message = `Unknown response of type ${result.responseType} and body ${hex}`;
                        result.category = ClientCategory.Error;
                        break;
                }
            }

            return result;
        }
    }
}