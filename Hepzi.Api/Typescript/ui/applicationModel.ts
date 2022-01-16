namespace Hepzi {
    interface ICredentials {
        sessionId: number;
        userId: number;
        username: string;
    }


    export class ApplicationModel {
        private _applicationClient: ApplicationClient | null = null;
        private readonly _configuration: Readonly<IConfiguration>;
        private readonly _factory: IFactory;
        private _isConnecting: boolean = false;
        private readonly _jquery: typeof jQuery;


        constructor(factory: IFactory, knockout: typeof ko, jquery: typeof jQuery) {
            if (!knockout) {
                throw Error("Knockout not loaded.");
            }

            if (!jQuery) {
                throw Error("JQuery not loaded.");
            }

            this._factory = factory;
            this._configuration = factory.getConfiguration();
            this._jquery = jquery;

            this.command = knockout.observable();
            this.console = knockout.observableArray(new Array<ConsoleEntry>() as Array<ConsoleEntry | undefined>);
            this.credentials = knockout.observable();
            this.isSending = knockout.observable(false);
            this.password = knockout.observable();
            this.showConsole = knockout.observable(false);
            this.target = knockout.observable();
            this.username = knockout.observable();

            this.interpretCommand = this.interpretCommand.bind(this);
            this.login = this.login.bind(this);
            this.logout = this.logout.bind(this);
            this.toggleConsole = this.toggleConsole.bind(this);
        }


        public readonly command: ko.Observable<string | undefined>;
        public readonly console: ko.ObservableArray<ConsoleEntry | undefined>;
        public readonly credentials: ko.Observable<ICredentials | undefined | null>;
        public readonly isSending: ko.Observable<boolean | undefined>;
        public readonly password: ko.Observable<string | undefined>;
        public readonly showConsole: ko.Observable<boolean | undefined>;
        public readonly target: ko.Observable<Mobile | undefined>;
        public readonly username: ko.Observable<string | undefined>;


        private addConsoleLine(entry: ConsoleEntry): void {
            this.console.push(entry);
            this.console.splice(0, this.console.length - this._configuration.consoleLines);

            window.setTimeout(this.scrollConsoleToBottom, this._configuration.consoleScrollDelayMilliseconds);
        }


        private addToast(text: string, title?: string): void {
            const $template = this._jquery('#toast-template');

            if ($template) {
                const $toast = $template.clone();
                $template.parent().prepend($toast);

                if (title) {
                    $toast.find('.toast-header strong').text(title);
                }
                $toast.find('.toast-body').text(text);
                $toast.toast('show');
                $toast.on('hidden.bs.toast', function () {
                    $toast.toast('dispose');
                    $toast.remove();
                });
            }
        }


        private applyTarget(target: Mobile | null): void {
            console.debug(`TARGET: ${target && target.name ? target.name : '<no-one>'}`);
            this.target(target ?? undefined);
            this.addToast(`${target && target.name ? target.name : '<no-one>'}`, 'Target');
        }


        private createClient(userId: number, sessionId: number): void {
            this._isConnecting = false;
            this.console([]);
            this.showConsole(false);

            if (this.credentials()) {
                const thisClient = this._applicationClient = this._factory.createApplicationClient(userId);
                const self = this;

                thisClient.on('close', function () { if (self._applicationClient == thisClient) { self.logout(); } });
                thisClient.on('connected', function () { if (self._applicationClient == thisClient) { self._isConnecting = false; } });
                thisClient.on('console', function () { if (self._applicationClient == thisClient) { self.toggleConsole(); } });
                thisClient.on('message', function (data) { if (self._applicationClient == thisClient) { self.addConsoleLine(data as ConsoleEntry); } });
                thisClient.on('target', function (target) { if (self._applicationClient == thisClient) { self.applyTarget(target); } });

                this._isConnecting = true;
                thisClient.connect(sessionId);
            }
        }


        public interpretCommand(): void {
            if (this._applicationClient) {
                this._applicationClient.interpretCommand((this.command() || '').trim());
                this.command('');
            }
        }


        public login(): void {
            if (!this.isSending()) {
                const self = this;
                const username = this.username()?.trim() ?? '';
                const password = this.password();

                this.credentials(null);

                if (username && password) {
                    this.isSending(true);

                    fetch("/login", {
                        method: 'POST',
                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    })
                    .then(function (response) {
                        switch (response.status) {
                            case 200:
                                response.json()
                                    .then(function (credentials) {
                                        if (credentials && credentials.username && credentials.userId && credentials.sessionId) {
                                            self.credentials(credentials);
                                            self.createClient(credentials.userId, credentials.sessionId);
                                            self.isSending(false);
                                            window.setTimeout(function () { document.getElementById('canvas')?.focus(); }, 500);
                                        } else {
                                            self.isSending(false);
                                            self.addToast('Invalid response from server');
                                        }
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                        self.isSending(false);
                                        self.addToast('Something went wrong creating connection to server.');
                                    });
                                break;

                            case 401:
                                self.isSending(false);
                                self.addToast('Username or password is incorrect.');
                                break;

                            default:
                                self.isSending(false);
                                self.addToast('HTTP Error (Status Code: ' + response.status + ")");
                                break;
                        }
                    })
                    .catch(function (error) {
                        self.isSending(false);
                        console.error(error);
                        self.addToast('Failed to connect to login server.');
                    });
                }
            }
        }


        public logout(): void {
            console.log('Logging out ...');

            if (this._isConnecting) {
                this.addToast('Unexpected disconnect');
                this._isConnecting = false;
            }

            if (this.credentials()) {
                this.credentials(null);
            }

            if (this._applicationClient) {
                this._applicationClient.disconnect();
                this._applicationClient = null;
            }
        }


        private scrollConsoleToBottom(): void {
            const element = document.getElementById('console');

            if (element) {
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }
        }


        public toggleConsole(): void {
            this.showConsole(!this.showConsole());
        }
    }
}