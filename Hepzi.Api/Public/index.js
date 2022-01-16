(function (ko) {
    var factory = Hepzi.Factory.instance;

    factory.debug('ApplicationClient', 'ClientResponseParser', 'InputHandler', 'SceneManager');
    ko.options.useOnlyNativeEvents = true;

    ko.applyBindings(factory.getApplicationModel());
})(window.ko);