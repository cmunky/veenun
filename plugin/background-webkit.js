
var service = (function () {

    var _config = {
            file: "./data/config-webkit.json",
            include: chrome.runtime.getManifest().content_scripts[0]["matches"][0]
        },
        _lastTabId = -1,
        _handlers = {

        onInitialize:  function (data) {
            chrome.tabs.query( { active: true, currentWindow: true}, function(tabs) {
                if (tabs.length) {
                    _lastTabId = tabs[0].id;
                    loadResources()
                    sendMessage('initComplete');
                }
            });
        },

        onLoadBranchLogs:  function (data) {
            if (_config.remote) {
                $(data).each(function(i, n) {
                    request(
                        _config.remote.concat('/git/branch/', n), 
                        function(data) { if (!data.error) {
                            sendMessage('branchLog', { branchName: n , logData: data });
                        }}
                    )
                });
            }
        },

        onSetAlarm:  function (data) {
            var timeout = data || 10; // minutes
            chrome.alarms.create( { delayInMinutes: timeout } );            
        },
    },

    alarmListener = function(msg) {
        console.log("alarm-listener : timer expired!", msg);
        sendMessage('intervalEvent');
    },

    backgroundListener = function (msg, _, sendResponse) {
        var e = msg.event || ' ',
        name = 'on'.concat(e[0].toUpperCase(), e.slice(1)),
        handler = _handlers[name]
        if (handler) { handler(msg.data) }
    },        

    loadResources = function(callback) {
        request(chrome.extension.getURL(_config.file), function(response) {
            updateConfig(response)
            sendMessage('configLoaded', _config);

            request(chrome.extension.getURL(_config.template), function(response) {
                sendMessage('templateLoaded', response); }, 'html');
        })
    },

    request = function(url, callback, format) {
        format = format || 'json';
        $.get(url, callback, format);
    },

    sendMessage = function(event, data) {
        if (_lastTabId < 0)
            _handlers.onInitialize()
        else
            chrome.tabs.sendMessage(_lastTabId, { event: event, data: data });
    },

    updateConfig = function(response) {
        var include = _config.include, 
        file = _config.file;
        _config = response;
        _config['include'] = include;
        _config['file'] = file;
    },

    init = function() { /* no-op*/ };

    chrome.runtime.onMessage.addListener(backgroundListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
    console.log('bound to: ', _config.include)

    return { init: init };
}());