/// <reference path="../comms/clientResponse.ts" />
/// <reference path="../gui/avatar.ts" />
/// <reference path="../utilities/arrayBufferWrapper.ts" />

namespace Hepzi {
    export class ClientResponseParser {
        private readonly _isDebug: boolean;
        

        public constructor(factory: IFactory) {
            this._isDebug = factory.isDebug('ClientResponseParser');
        }


        public parseResponse(userId: number, response: any, context: ApplicationContext | null): ClientResponse {
            let result: ClientResponse;

            try {
                if (response instanceof ArrayBuffer) {
                    result = this.parseBinaryResponse(userId, new ArrayBufferWrapper(response as ArrayBuffer), context);
                } else if (typeof response === 'string' || response instanceof String) {
                    result = new ClientResponse(ClientResponseType.InstanceMessage);
                    result.log = this._isDebug ? `SYSTEM MESSAGE: ${response}` : undefined;
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
            const position = buffer.getVector3d(100);
            const direction = buffer.getVector3d(100);
            const name = buffer.getString();

            return new Avatar(name, userId === sessionUserId, userId, position, direction);
        }


        private parseBinaryResponse(userId: number, buffer: ArrayBufferWrapper, context: ApplicationContext | null): ClientResponse {
            let result: ClientResponse;

            if (buffer.length <= 0) {
                result = new ClientResponse(ClientResponseType.Unknown);
                result.message = "Empty binary message received from server";
                result.category = ClientCategory.Debug;
            } else {
                result = new ClientResponse(buffer.getByte());

                switch (result.responseType) {
                    case ClientResponseType.Welcome:
                        result.log = this._isDebug ? 'CONNECTED TO INSTANCE' : undefined;
                        result.message = 'Connected to instance.';
                        break;

                    case ClientResponseType.Heartbeat:
                        result.log = this._isDebug ? 'HEARTBEAT' : undefined;
                        result.message = 'Heatbeat from instance.';
                        result.category = ClientCategory.Debug;
                        break;

                    case ClientResponseType.InitialInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        result.log = this._isDebug ? `INITIAL USER: #${result.userId} => ${result.avatar.name}` : undefined;
                        result.message = result.userId !== userId ? `${result.avatar.name} is here.` : '';
                        context?.addAvatar(result.avatar);
                        break;

                    case ClientResponseType.AddInstanceSession:
                        result.avatar = this.parseAvatar(userId, buffer);
                        result.userId = result.avatar.userId;
                        result.log = this._isDebug ? `ADD USER: #${result.userId} => ${result.avatar.name}` : undefined;
                        result.message = result.userId === userId ? 'You have joined the area.' : `${result.avatar.name} has joined the area.`;
                        result.category = ClientCategory.Important;
                        context?.addAvatar(result.avatar);
                        break;

                    case ClientResponseType.RemoveInstanceSession:
                        result.userId = buffer.getInteger();
                        result.avatar = context?.getAvatar(result.userId) ?? undefined;
                        const avatarName = result.avatar?.name || `User#${result.userId}`
                        result.log = this._isDebug ? `REMOVE USER: #${result.userId}` : undefined;
                        result.message = result.userId !== userId ? `${avatarName} has left the area.`: '';
                        result.category = ClientCategory.Important;

                        if (context && context.protagonist.userId !== result.userId) {
                            context.removeAvatar(result.userId);
                        }
                        break;

                    case ClientResponseType.InstanceMessage:
                        const text = buffer.getString();
                        result.log = this._isDebug ? `INSTANCE MESSAGE: ${text}` : undefined;
                        result.message = `**** ${text} ****`;
                        result.category = ClientCategory.System;
                        break;

                    case ClientResponseType.KickClient:
                        result.log = this._isDebug ? 'KICKED' : undefined;
                        result.message = `Your session has been terminated.`;
                        result.category = ClientCategory.System;
                        result.isTerminal = true;
                        break;

                    case ClientResponseType.MoveClient:
                        result.userId = buffer.getInteger();
                        const position = buffer.getVector3d(100);
                        const direction = buffer.getVector3d(100);
                        const avatar = result.avatar = context?.getAvatar(result.userId) ?? undefined;

                        if (avatar) {
                            if (!avatar.isProtagonist) {
                                avatar.position.copyFrom(position);
                                avatar.direction.copyFrom(direction);
                                avatar.setMeshRotationFromDirection();
                                result.log = this._isDebug ? `MOVE USER: #${result.userId} ${position} ${direction}` : undefined;
                                result.category = ClientCategory.Debug;
                            } else {
                                result.log = this._isDebug ? `MOVE SELF NO-OP: ${position} ${direction}` : undefined;
                                result.category = ClientCategory.Debug;
                            }
                        } else {
                            result.log = `MOVE USER: cannot find user #${result.userId}`;
                            result.category = ClientCategory.Error;
                        }
                        break;

                    default:
                        const hex = buffer.getHex();
                        result.log = this._isDebug ? `UNKNOWN RESPONSE TYPE: ${result.responseType} => ${hex}` : undefined;
                        result.message = `Unknown response of type ${result.responseType}`;
                        result.category = ClientCategory.Error;
                        break;
                }
            }

            return result;
        }
    }
}