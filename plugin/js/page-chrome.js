
var veeNone = (function ($, $app) {
    var _private,

    pageListener = function (msg, _, sendResponse) {
        if (msg.remoteResponse) {
            console.log("remoteResponse: " + msg.data);

            // *** RELOAD PAGE ***
            //location.reload()

        } else if (msg.configLoaded) {

            config.defaultColors = msg.config.colors;

            config.apply(msg.config, function() {
                console.log('config applied!')

                // The ui library relies on config for colors
                ui.createElements();

            });

        } else if (msg.branchLog) {
            
            console.log('event', msg.logData)

            stories.storyLogs(msg.branchName, msg.logData)

        } else if (msg.initComplete) {

            $app.sendMessage({ setAlarm: true, timeout: 0.2 }); // 20 seconds (debug only)

            stories.load();

            $app.sendMessage({ loadBranchLogs: true , branchNames: stories.names() });

            // ui.createElements();

        } else if (msg.loadStories) {

            stories.load();

            // ui.createElements()

        } else { // unknown messages
            console.log("page-listener: " + JSON.stringify(msg), _, sendResponse);
        }
    },

    init = function() {
        platform.init($app)
        config.init($);
        stories.init($);
        ui.init($);

        $app.sendMessage({ init: true });
    };

    $app.onMessage.addListener(pageListener);

    return {
        init: init
    };

}($, chrome.runtime));
$(function() { veeNone.init(); });
