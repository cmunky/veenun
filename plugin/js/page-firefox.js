
$events = self.port

var veeNone = (function ($, $events) {
    var _private, 

    onLoadStories = function() {

        // stories.load()

        // ui.createElements()

    },

    onRemoteResponse = function(response) {
        console.log("remoteResponse: " + JSON.stringify(response));

        // *** RELOAD PAGE ***
        //window.location.reload(); 
    },

    onBranchLog = function(msg) {

        stories.storyLogs(msg.branchName, msg.logData)
    },

    onInitComplete = function() {

        setAlarm((20 * 1000)) // 20 seconds (debug only)

        stories.load()

        config.defaultColors = self.options.colors;

        config.apply({colors: self.options.colors})

        sendMessage('loadBranchLogs', stories.names());

        ui.createElements()
    },

    init = function() {
        platform.init(self)
        config.init($)
        stories.init($)
        ui.init($)

        sendMessage('init');
    };

    addListener("remoteResponse", onRemoteResponse);
    addListener("loadStories", onLoadStories);
    addListener("branchLog", onBranchLog);
    addListener("initComplete", onInitComplete);

    return {
        init: init
};
}($, self.port));

$(function() { veeNone.init(); });