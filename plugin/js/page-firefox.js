
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
            sendMessage('loadBranchLogs', stories.names());
            ui.createElements(_template)
        });
    },

    onIntervalEvent = function() {
        if (stories.branchList.length === 0) {
                sendMessage('loadBranchLogs', stories.names());
        }
        // TODO: Do interval stuff here...

        setAlarm(platform.timeout()) 
    },

    onTemplateLoaded = function(template) {
        _template = template;
    },

    pageListener = function() {
        addListener("branchLog", onBranchLog);
        addListener("initComplete", onInitComplete);
        addListener("templateLoaded", onTemplateLoaded);
        addListener("intervalEvent", onIntervalEvent);
    },

    init = function() {
        platform.init(self)
        config.init($)
        stories.init($)
        ui.init($)

        sendMessage('initialize');
    };

    pageListener();

    return { init: init };
}($, self.port));
$(function() { veeNone.init(); });