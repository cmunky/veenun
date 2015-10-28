
$events = self.port

var veeNone = (function ($, $events) {
    var _private,
        _template,

    onBranchLog = function(msg) {

        stories.storyLogs(msg.branchName, msg.logData)
    },

    onInitComplete = function() {

        stories.load()

        config.apply({colors: self.options.colors}, function() {
            console.log('config applied!')

            setAlarm(platform.timeout()) 
            console.log('refresh timeout:', platform.timeout())

            sendMessage('loadBranchLogs', stories.names());

            // The ui library relies on config for colors
            ui.createElements(_template)
        });
    },

    onTemplateLoaded = function(template) {

        _template = template;

    },

    onLoadStories = function() {

        stories.load()

        // ui.createElements(_template)
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
    addListener("templateLoaded", onTemplateLoaded);

    return { init: init };
}($, self.port));
$(function() { veeNone.init(); });