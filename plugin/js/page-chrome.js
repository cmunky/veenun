
var veeNone = (function ($, $app) {
    var _private,
        _template,

    pageListener = function (msg, _, sendResponse) {
        if (msg.branchLog) {

            stories.storyLogs(msg.branchName, msg.logData)

        } else if (msg.configLoaded) {

            config.apply(msg.config, function() {
                console.log('config applied!')

                $app.sendMessage({ setAlarm: true, timeout: platform.timeout() });
                console.log('refresh timeout:', platform.timeout())

            });

        } else if (msg.templateLoaded) {

            _template = msg.template;

            // The ui library relies on config for colors
            ui.createElements(_template);

        } else if (msg.initComplete) {

            stories.load();

            $app.sendMessage({ loadBranchLogs: true , branchNames: stories.names() });

        } else if (msg.loadStories) {

            stories.load();

            // ui.createElements(_template)

        } else if (msg.remoteResponse) {
            console.log("remoteResponse: " + msg.data);

            // *** RELOAD PAGE ***
            //location.reload()

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

    return { init: init };
}($, chrome.runtime));
$(function() { veeNone.init(); });