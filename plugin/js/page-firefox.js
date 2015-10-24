
$events = self.port

var veeNone = (function ($, $events) {
    var _private, 

    onBranchLog = function(msg) {

        stories.storyLogs(msg.branchName, msg.logData)
    },

    onInitComplete = function() {

        setAlarm((20 * 1000)) // 20 seconds (debug only)

        stories.load()

        config.apply({colors: self.options.colors}, function() {
            console.log('config applied!')

            sendMessage('loadBranchLogs', stories.names());

            // The ui library relies on config for colors
            ui.createElements()
        });
    },

    onLoadStories = function() {

        stories.load()

        // ui.createElements()
    },

    onRemoteResponse = function(response) {
        console.log("remoteResponse: " + response);

        // *** RELOAD PAGE ***
        //window.location.reload();
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

    return { init: init };
}($, self.port));
$(function() { veeNone.init(); });