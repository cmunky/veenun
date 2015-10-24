
var service = (function () {

    var _config = {
            file: "./data/config-webkit.json",
            include: chrome.runtime.getManifest().content_scripts[0]["matches"][0]
        },
        _lastTabId,

    alarmListener = function(msg) {
        console.log("alarm-listener : timer expired!", msg);

        sendMessage({ loadStories: true });

        requestRemote(_config.remote, onRemoteResponse)
    },

    backgroundListener = function(msg, _, sendResponse) {
        if (msg.setAlarm) {
            timeout = msg.timeout || 10; // minutes
            chrome.alarms.create( { delayInMinutes: timeout } );

        } else if (msg.loadBranchLogs) {

            onLoadBranchLogs(msg.branchNames, onBranchLogLoaded)

        } else if (msg.init) {

            onInitialize()

        } else { // unknown messages
            console.log('background-listener: ', JSON.stringify(msg), _, sendResponse);
        }
    },

    loadConfig = function(callback) {
        var include = _config.include
        var file = _config.file
        $.get(chrome.extension.getURL(_config.file), function(data, status, xhr) {
            _config = data;
            _config['include'] = include
            _config['file'] = file
            sendMessage({ configLoaded: true, config: _config });
        }, "json")
    },

    onBranchLogLoaded = function(branch, logData) {

        if (!logData.error) {
            sendMessage({ branchLog : true, branchName: branch , logData: logData });
        }
    },

    onInitialize = function() {
        chrome.tabs.query( { active: true, currentWindow: true}, function(tabs) {
            if (tabs.length) {
                _lastTabId = tabs[0].id;
                loadConfig()
                sendMessage({ initComplete: true});
            }
        });
    },

    onLoadBranchLogs = function(branchList, callback) {
        // console.log('[background] onLoadBranchLogs', branchList)
        if (branchList) {
            $(branchList).each(function(i, n) {
                var url = _config.remote.concat('/git/branch/', n);
                $.get(url, function(data, status, xhr) {
                    callback(n, data)
                }, 'json');
            });
        }
    },

    onRemoteResponse = function(dat, res, xhr) {

        console.log('[background] onRemoteResponse: ' + xhr.responseText);

        sendMessage({ remoteResponse: true, data: xhr.responseText });
    },

    requestRemote = function(url, callback) {
        $.get(url, callback);
    },

    sendMessage = function(msg) {
        if (_lastTabId < 0)
            initialize()
        else
            chrome.tabs.sendMessage(_lastTabId, msg );
    },

    init = function() { /* no-op*/ };

    chrome.runtime.onMessage.addListener(backgroundListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
    console.log('bound to: ', _config.include)

    return { init: init };

}());
