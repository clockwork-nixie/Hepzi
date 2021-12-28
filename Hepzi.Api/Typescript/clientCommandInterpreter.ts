/// <reference path="arrayBufferWrapper.ts" />
/// <reference path="clientCommandBuilder.ts" />

namespace Hepzi {
    export class ClientCommandInterpreter {
        public interpretCommand(userId: number, request: string, avatars: AvatarLookup): ClientCommand {
            let result: ClientCommand;

            try {
                const words = request.split(' ').filter(s => s ? s : null);

                if (words.length) {
                    const command = words[0].toLowerCase();

                    switch (command) {
                        case '/exit':
                            result = new ClientCommand(ClientRequestType.Unknown);
                            result.isTerminal = true;
                            result.log = 'EXIT';
                            break;

                        case '/kick':
                            result = new ClientCommand(ClientRequestType.KickClient);

                            if (words.length < 2) {
                                result.message = `Syntax should be: ${command} <name>`;
                                result.category = ClientCategory.Error;
                            } else {
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
                                } else {
                                    result.message = `Cannot kick unknown user: ${name}`;
                                    result.category = ClientCategory.Error;
                                }
                            }
                            break;

                        case '/system':
                            const remainder = request.slice(command.length).trim();
                            const message = new TextEncoder().encode(remainder);
                            const buffer = new ArrayBuffer(1 + message.length);
                            const writer = new Hepzi.ArrayBufferWrapper(buffer);

                            result = new ClientCommand(ClientRequestType.InstanceMessage);

                            writer.putByte(result.command);
                            writer.putByteArray(message);

                            result.buffer = buffer;
                            result.log = `SEND SYSTEM: ${remainder}`;
                            break;

                        case '/who':
                            result = new ClientCommand(ClientRequestType.Unknown);
                            result.message = [`${command}`].concat(Object.keys(avatars).map(userId => `\u2022 ${avatars[parseInt(userId)]?.name}`));
                            result.log = 'WHO';
                            break;

                        default:
                            result = new ClientCommand(ClientRequestType.Unknown);
                            result.message = `Unknown command: ${command}`;
                            result.category = ClientCategory.Error;
                    }
                } else {
                    result = new ClientCommand(ClientRequestType.Unknown);
                    result.message = `(nothing to send)`;
                    result.category = ClientCategory.Debug;
                }
            } catch (error) {
                result = new ClientCommand(ClientRequestType.Unknown);
                result.log = `ERROR interpreting input: ${error}`;
                result.message = `Error: ${error}`;
                result.category = ClientCategory.Error;
            }

            return result;
        }


        private getUserIdByAvatarName(name: string, avatars: AvatarLookup): (number | null) {
            name = name.toLowerCase();

            return parseInt(Object.keys(avatars).filter(userId => avatars[parseInt(userId)]?.name.toLowerCase() == name)[0]) || null;
        }
    }
}