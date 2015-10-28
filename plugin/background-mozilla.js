
var service = (function () {

    var events = require("./js/events.js"),
        config = require("./data/config-mozilla.json"),
        options = config.contentScriptOptions,
        pageMod = require("sdk/page-mod"),
        Request = require("sdk/request").Request,
        resource = require("sdk/self").data,
        template = resource.load(options.template),

    onBranchLogLoaded = function(response) {
        var logData = response.json
        if (!logData.error) {
            events.sendMessage("branchLog", { branchName: logData.q , logData: logData });
        }
    },

    onInitialized = function() {
        console.log('[background] onInitialized: ');

        events.sendMessage("templateLoaded", template);

        events.sendMessage("initComplete")
    },

    onLoadBranchLogs = function(branchList) {
        // console.log('[background] onLoadBranchLogs: ', branchList);
       if (branchList) {
            for (var i in branchList) {
                requestRemote(
                    options.remote.concat('/git/branch/', branchList[i]),
                    onBranchLogLoaded);
            }
        }
    },

    onRemoteResponse = function(response) {

        console.log('[background] onRemoteResponse: ' + response.text)

        events.sendMessage("remoteResponse", { data: response.text } )
    },

    onTimeoutExpired = function() {
        console.log('[background] onTimeoutExpired: ');
        
        events.sendMessage("loadStories" )
        
        requestRemote(options.remote, onRemoteResponse)
    },

    requestRemote = function(url, callback) {
        Request({ url: url, onComplete: callback }).get()
    },

    startListening = function(worker) {
        events.initialize(worker.port);
        events.addListener('timeoutExpired', onTimeoutExpired);
        events.addListener('loadBranchLogs', onLoadBranchLogs);
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
