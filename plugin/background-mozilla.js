
var service = (function () {

    var events = require("./data/events.js"),
        config = require("./data/config-mozilla.json"),
        options = config.contentScriptOptions,
        pageMod = require("sdk/page-mod"),
        Request = require("sdk/request").Request,
        resource = require("sdk/self").data,

    loadTemplates = function() {
        var file = resource.load(resource.url("template.html"))
        console.log('template: ', file)
    },

    onInitialized = function() {
        console.log('[background] init handler: ');

        events.sendMessage("initComplete")
    },

    onRemoteResponse = function(response) {
        console.log('[background] request: ' + response.text)
         
        for (var headerName in response.headers) {
            console.log(headerName + " : " + response.headers[headerName]);
        }

        events.sendMessage("remoteResponse", { data: response.text } )

    },

    onTimeoutExpired = function() {
        console.log('[background] timeoutExpired handler: ');
        
        events.sendMessage("loadStories" )
        
        // loadTemplates()

        requestRemote(options.remote, onRemoteResponse)
    },

    requestRemote = function(url, callback) {
        Request({ url: url, onComplete: callback }).get()
    },

    startListening = function(worker) {
        events.initialize(worker.port);
        events.addListener('timeoutExpired', onTimeoutExpired);
        events.addListener('init', onInitialized);
    },

    init = function() { /* no-op */ };

    config['onAttach'] = startListening;
    options.branchUrl = resource.url(options.branchUrl);
    options.gearUrl = resource.url(options.gearUrl);
    options.plusUrl = resource.url(options.plusUrl);

    pageMod.PageMod(config);
    console.log('bound to: ', config.include);

    return { init: init };
}());
