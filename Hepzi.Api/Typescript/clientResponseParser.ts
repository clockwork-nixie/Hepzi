/// <reference path="arrayBufferWrapper.ts" />

namespace Hepzi {
    export class ClientResponseParser {
        public parseResponse(userId: number, response: any, avatars: AvatarLookup): ClientResponse {
            let result: ClientResponse;

            try {
                if (response instanceof ArrayBuffer) {
                    result = this.parseBinaryResponse(userId, new ArrayBufferWrapper(response as ArrayBuffer), avatars);
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


        private parseAvatar(sessionUserId: number, buffer: ArrayBufferWrapper, ): Avatar {
            const userId = buffer.getInteger();
            const position = buffer.getVector3d();
            const direction = buffer.getVector3d();
            const name = buffer.getString();

            return new Avatar(name, userId === sessionUserId, userId, position, direction);
        }


        private parseBinaryResponse(userId: number, buffer: ArrayBufferWrapper, avatars: AvatarLookup): ClientResponse {
            let result: ClientResponse;

            if (buffer.length <= 0) {
                result = new ClientResponse(ClientResponseType.Unknown);
                result.message = "Empty binary message received from server";
                result.category = ClientCategory.Debug;
            } else {
                result = new ClientResponse(buffer.getByte());

                switch (result.responseType) {
                    case ClientResponseType.Welcome:
                        result.log = 'JOINING';
                        result.message = 'Connected to instance.';
                        break;

                    case ClientResponseType.Heartbeat:
                        result.log = 'HEARTBEAT';
                        result.message = 'Heatbeat from instance.';
                        result.category = ClientCategory.Debug;
                        break;

                    case ClientResponseType.InitialInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        avatars[result.userId] = result.avatar;
                        result.log = `INITIAL USER: #${result.userId} => ${result.avatar.name}`;
                        result.message = `${result.avatar.name} is here.`;
                        break;

                    case ClientResponseType.AddInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        avatars[result.userId] = result.avatar;
                        result.log = `ADD USER: #${result.userId} => ${result.avatar.name}`;
                        result.message = result.userId == userId ? 'You have joined the area.' : `${result.avatar.name} has joined the area.`;
                        result.category = ClientCategory.Important;
                        break;

                    case ClientResponseType.RemoveInstanceSession:
                        result.userId = buffer.getInteger();
                        result.avatar = avatars[result.userId];
                        const avatarName = result.avatar?.name || `User#${result.userId}`
                        result.log = `REMOVE USER: #${result.userId}`;
                        result.message = `${avatarName} has left the area.`;
                        result.category = ClientCategory.Important;
                        delete avatars[result.userId];
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

                    case ClientResponseType.MoveClient:
                        result.userId = buffer.getInteger();
                        const position = buffer.getVector3d();
                        const direction = buffer.getVector3d();
                        const avatar = result.avatar = avatars[result.userId];

                        if (avatar) {
                            if (!avatar.isSelf) {
                                avatar.position.x = position.x;
                                avatar.position.y = position.y;
                                avatar.position.z = position.z;
                                avatar.direction.x = direction.x;
                                avatar.direction.y = direction.y;
                                avatar.direction.z = direction.z;
                                result.log = `MOVE USER: #${result.userId} (${position.x}, ${position.y}, ${position.z})`;
                                result.category = ClientCategory.Debug;
                            } else {
                                result.log = `MOVE SELF NO-OP: (${position.x}, ${position.y}, ${position.z})`;
                                result.category = ClientCategory.Debug;
                            }
                        } else {
                            result.log = `MOVE USER: cannot find user #${result.userId}`;
                            result.category = ClientCategory.Error;
                        }
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