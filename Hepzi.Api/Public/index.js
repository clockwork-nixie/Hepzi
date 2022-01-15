(function (ko) {
    var factory = Hepzi.Factory.instance;
    var configuration = factory.getConfiguration();
    var applicationClient;
    var isConnecting = false;

    factory.debug('ApplicationClient');
    factory.debug('ClientResponseParser');
    factory.debug('InputHandler');
    factory.debug('SceneManager');
        
    ko.options.useOnlyNativeEvents = true;


    function addConsoleLine(data) {
        var console = applicationModel.console;

        console.push(data);
        console.splice(0, console().length - configuration.consoleLines);

        window.setTimeout(function () {
            var element = document.getElementById('console');
            var lines = element? element.getElementsByClassName('console-line'): null;

            if (lines && lines.length) {
                lines[lines.length - 1].scrollIntoView();
            }
        }, configuration.consoleScrollDelayMilliseconds);
    }


    function addToast(text, title) {
        var $template = $('#toast-template');

        if ($template) {
            $toast = $template.clone();
            $template.parent().prepend($toast);

            if (title) {
                $toast.find('.toast-header strong').text(title);
            }
            $toast.find('.toast-body').text(text);
            $toast.toast('show');
            $toast.on('hidden.bs.toast', function() {
                $toast.toast('dispose');
                $toast.remove();
            });
        }
    }


    function applyTarget(target) {
        console.debug(`TARGET: ${target && target.name ? target.name : '<no-one>'}`);
        applicationModel.target(target);
        addToast(`${target && target.name ? target.name : '<no-one>'}`, 'Target');
    }


    function createClient() {
        isConnecting = false;
        applicationModel.console([]);
        applicationModel.showConsole(false);

        var thisClient = applicationClient = factory.createApplicationClient(applicationModel.credentials().userId);

        thisClient.on('close', function () { if (applicationClient == thisClient) { applicationModel.logout(); } });
        thisClient.on('console', function () { if (applicationClient == thisClient) { applicationModel.toggleConsole(); } });
        thisClient.on('message', function (data) { if (applicationClient == thisClient) { addConsoleLine(data); } });
        thisClient.on('target', function (target) { if (applicationClient == thisClient) { applyTarget(target); } });

        isConnecting = true;
        thisClient.connect(applicationModel.credentials().sessionId);
    }


    function interpretCommand(model) {
        if (applicationClient) {
            applicationClient.interpretCommand((model.command() || '').trim())
            model.command('');
        }
    }


    function login(model) {
        if (!model.isSending()) {
            var username = model.username().trim();
            var password = model.password();

            model.credentials(null);

            if (username && password) {
                model.isSending(true);

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
                                            model.credentials(credentials);
                                            createClient();
                                            model.isSending(false);
                                            window.setTimeout(function () { document.getElementById('canvas').focus(); }, 1000);
                                        } else {
                                            model.isSending(false);
                                            addToast('Invalid response from server');
                                        }
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                        model.isSending(false);
                                        addToast('Something went wrong creating connection to server.');
                                    });
                                break;

                            case 401:
                                model.isSending(false);
                                addToast('Username or password is incorrect.');
                                break;

                            default:
                                model.isSending(false);
                                addToast('HTTP Error (Status Code: ' + response.status + ")");
                                break;
                        }
                    })
                    .catch(function (err) {
                        model.isSending(false);
                        console.log(err);
                        addToast('Failed to connect to login server.');
                    });
            }
        }
    }


    function logout(model) {
        console.log('Logging out ...');

        if (isConnecting) {
            addToast('Unexpected disconnect');
            isConnecting = false;
        }

        if (model.credentials()) {
            model.credentials(null);
        }

        if (applicationClient) {
            applicationClient.disconnect();
            applicationClient = null;
        }
    }


    var applicationModel = {
        command: ko.observable(),
        console: ko.observableArray([]),
        credentials: ko.observable(),
        interpretCommand: function () { interpretCommand(applicationModel); },
        isSending: ko.observable(false),
        login: function () { login(applicationModel); },
        logout: function () { logout(applicationModel); },
        password: ko.observable(),
        showConsole: ko.observable(false),
        target: ko.observable(),
        toggleConsole: function () { applicationModel.showConsole(!applicationModel.showConsole()) },
        username: ko.observable()        
    };

    ko.applyBindings(applicationModel);
})(ko);