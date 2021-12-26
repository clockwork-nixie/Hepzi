(function (ko) {
    ko.options.useOnlyNativeEvents = true;


    function addConsoleLine(data) {
        if (applicationModel.console().length > 100) { // TODO: configuration
            applicationModel.console.shift();
        }
        applicationModel.console.push(data);

        window.setTimeout(() => {
            var consoleElements = document.getElementById("console").getElementsByClassName('console-line');

            if (consoleElements.length) {
                consoleElements[consoleElements.length - 1].scrollIntoView();
            }
        }, 100);
    }


    function createClient() {
        var client = applicationModel.client = new Hepzi.ApplicationClient(
            applicationModel.credentials().userId,
            new Hepzi.WebSocketClient({ isDebug: true }),
            { isDebug: true });

        applicationModel.console([]);
        applicationModel.showConsole(false);

        applicationModel.client.on('close', () => { if (applicationModel.client == client) { applicationModel.logout(); }});
        applicationModel.client.on('kicked', () => { if (applicationModel.client == client) { applicationModel.logout(); }});
        applicationModel.client.on('message', data => { if (applicationModel.client == client) { addConsoleLine(data); }});
        applicationModel.client.connect(applicationModel.credentials().sessionId);
    }


    function login(username, password, model) {
        if (!model.isSending()) {
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
                                            window.setTimeout(function () { document.getElementById('command').focus(); }, 0);
                                            model.isSending(false);
                                        } else {
                                            model.isSending(false);
                                            alert('Invalid response from server');
                                        }
                                    })
                                    .catch(function (err) {
                                        console.log(err);
                                        model.isSending(false);
                                        alert('Something went wrong creating connection to server.');
                                    });
                                break;

                            case 401:
                                model.isSending(false);
                                alert('Username or password is incorrect.');
                                break;

                            default:
                                model.isSending(false);
                                alert('HTTP Error (Status Code: ' + response.status + ")");
                                break;
                        }
                    })
                    .catch(function (err) {
                        model.isSending(false);
                        console.log(err);
                        alert('Failed to connect to login server.');
                    });
            }
        }
    }


    function logout(model) {
        if (model.credentials()) {
            model.credentials(null);
        }

        if (model.client) {
            model.client.disconnect();
            model.client = null;
        }
    }


    function sendCommand(model) {
        if (model.client) {
            model.client.interpretCommand((model.command() || '').trim())
            model.command('');
        }
    }


    var applicationModel = {
        client: null,
        command: ko.observable(),
        console: ko.observableArray([]),
        credentials: ko.observable(),
        isSending: ko.observable(false),
        login: (username, password) => login(username.trim(), password, applicationModel),
        logout: () => logout(applicationModel),
        password: ko.observable(),
        send: () => sendCommand(applicationModel),
        showConsole: ko.observable(false),
        toggleConsole: () => applicationModel.showConsole(!applicationModel.showConsole()),
        username: ko.observable()        
    };

    ko.applyBindings(applicationModel);
})(ko);