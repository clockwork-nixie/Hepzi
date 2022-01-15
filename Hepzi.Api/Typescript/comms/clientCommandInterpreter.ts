/// <reference path="../gui/avatar.ts" />
/// <reference path="../utilities/arrayBufferWrapper.ts" />
/// <reference path="./clientCategory.ts" />
/// <reference path="./clientCommandBuilder.ts" />
/// <reference path="./clientRequestType.ts" />

namespace Hepzi {
    export class ClientCommandInterpreter {
        public static interpretCommand(request: string, context: ApplicationContext): ClientCommand {
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

                            if (words.length > 2) {
                                result.message = `Syntax should be: ${command} {<name>}`;
                                result.category = ClientCategory.Error;
                            } else if (words.length === 1 && !(context.target instanceof Avatar)) {
                                result.message = context.target ? 'You can\'t kick that.' : 'No-one to kick.';
                                result.category = ClientCategory.Error;
                            } else {
                                const name = words.length === 1 ? (context.target as Avatar).name : words[1];
                                const targetUserId = words.length === 1 ? (context.target as Avatar).userId :
                                    context?.getUserIdByAvatarName(words[1]);

                                if (!targetUserId) {
                                    result.message = `Cannot kick unknown user: ${name}`;
                                    result.category = ClientCategory.Error;
                                } else {
                                    const buffer = new ArrayBuffer(5);
                                    const writer = new ArrayBufferWrapper(buffer);

                                    writer.putByte(result.command);
                                    writer.putInteger(targetUserId);

                                    result.buffer = buffer;
                                    result.log = `SEND KICK #${targetUserId}`;
                                    result.message = `${command} ${name}`;
                                }
                            }
                            break;

                        case '/system':
                            const remainder = request.slice(command.length).trim();
                            const message = new TextEncoder().encode(remainder);
                            const buffer = new ArrayBuffer(1 + message.length);
                            const writer = new ArrayBufferWrapper(buffer);

                            result = new ClientCommand(ClientRequestType.InstanceMessage);

                            writer.putByte(result.command);
                            writer.putByteArray(message);

                            result.buffer = buffer;
                            result.log = `SEND SYSTEM: ${remainder}`;
                            break;

                        case '/who':
                            result = new ClientCommand(ClientRequestType.Unknown);
                            result.message = context ? [`${command}`].concat(context.getAvatars().map(avatar => `\u2022 ${avatar.name}`)) : undefined;
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
    }
}