
var veeNone = (function ($, $app) {
    var _template,
        _handlers = {

        onBranchLog:  function (data) {
            stories.storyLogs(data.branchName, data.logData)
        },

        onConfigLoaded:  function (data) {
            config.apply(data, function() {
                console.log('config applied!')
                sendMessage('setAlarm', platform.timeout());
            });
        },

        onInitComplete:  function (data) {
            stories.load();
            sendMessage('loadBranchLogs', stories.names());
        },

        onIntervalEvent:  function (data) {
            if (stories.branchList.length === 0) {
                sendMessage('loadBranchLogs', stories.names());
            }
            // TODO: Do interval stuff here...
            
            sendMessage('setAlarm', platform.timeout());
        },

        onTemplateLoaded:  function (data) {
            _template = data;
            ui.createElements(_template);
        },
    },

    pageListener = function (msg, _, sendResponse) {
        var e = msg.event || ' ',
        name = 'on'.concat(e[0].toUpperCase(), e.slice(1)),
        handler = _handlers[name];
        // var handler = _handlers[msg.event];
        if (handler) { handler(msg.data) }
    },

    sendMessage = function(event, data) {
        $app.sendMessage({ event: event, data: data });
    },

    init = function() {
        platform.init($app)        
        config.init($);
        stories.init($);
        ui.init($);

        sendMessage('initialize');
    };

    $app.onMessage.addListener(pageListener);

    return { init: init };
}($, chrome.runtime));
$(function() { veeNone.init(); });