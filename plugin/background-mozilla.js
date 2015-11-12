
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

    onInitialize = function() {
        events.sendMessage("templateLoaded", template);
        events.sendMessage("initComplete")
    },

    onLoadBranchLogs = function(branchList) {
        if (branchList) {
            for (var i in branchList) {
                request(
                    options.remote.concat('/git/branch/', branchList[i]),
                    onBranchLogLoaded);
            }
        }
    },

    alarmListener = function() {
        console.log('[background] onTimeoutExpired: ');
        
        events.sendMessage("intervalEvent");
    },

    backgroundListener = function(worker) {
        events.initialize(worker.port);
        events.addListener('timeoutExpired', alarmListener);
        events.addListener('loadBranchLogs', onLoadBranchLogs);
        events.addListener('initialize', onInitialize);
    },

    request = function(url, callback) {
        Request({ url: url, onComplete: callback }).get()
    },

    init = function() { /* no-op */ };

    config['onAttach'] = backgroundListener;
    options.branchUrl = resource.url(options.branchUrl);
    options.gearUrl = resource.url(options.gearUrl);
    options.plusUrl = resource.url(options.plusUrl);

    pageMod.PageMod(config);
    console.log('bound to: ', config.include);

    return { init: init };
}());