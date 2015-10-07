
var service = (function () {

    var _private,
        _lastTabId,
        _config,
        _urls = {
          site: chrome.runtime.getManifest().content_scripts[0]["matches"][0],
          template: chrome.extension.getURL("./data/template.html"),
          config: chrome.extension.getURL("./data/config-webkit.json")
        },

    alarmListener = function(msg) {
        console.log("alarm-listener : timer expired!", msg);

        sendMessage({ loadStories: true });

        // loadTemplates()

        requestRemote(_config.remote, onRemoteResponse)
    },

    backgroundListener = function(msg, _, sendResponse) {
      if (msg.setAlarm) {
          timeout = msg.timeout || 10; // minutes
          chrome.alarms.create( { delayInMinutes: timeout } );

      } else if (msg.loadConfig) {

          onLoadConfig()

      } else if (msg.loadBranchLogs) {

          onLoadBranchLogs(msg.branchNames, onBranchLogLoaded)

      } else if (msg.init) {

          onInitialize()

      } else { // unknown messages
          console.log('background-listener: ', JSON.stringify(msg), _, sendResponse);
      }
    },

    onBranchLogLoaded = function(logData) {

        sendMessage({ branchLog : true, branchName: logData.branchName , logData: logData });

    },

    onLoadBranchLogs = function(branchList, callback) {
        console.log('onLoadBranchLogs', branchList)

        var getRandomInt = function(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        };
        $(branchList).each(function(i, n) {

          setTimeout(function() {
            callback({
              branchName: n,
              stuff: 'such', when: 'then', why: 'just because'
            });
          }, getRandomInt(250, 1250));

          /*var url = _urls.remote + 'other stuff...';

          $.get(url, function(response, moar, xhr) {

            console.log(response)

            callback(response)

          }, dataType: 'json');*/
        });
    },

    onLoadConfig = function(callback) {
        $.get(_urls.config, function(response) {
              _config = JSON.parse(response);
              sendMessage({ configLoaded: true, config: _config });
        })
    },

    loadTemplates = function() {
        $.get(_urls.template, function(response) {

            console.log(response)

        })
    },

    onInitialize = function() {
        chrome.tabs.query( { active: true, currentWindow: true}, function(tabs) {
          if (tabs.length) {
            _lastTabId = tabs[0].id;
            sendMessage({ initComplete: true, config: _config});
          }
        });
    },

    onRemoteResponse = function(dat, res, xhr) {
        console.log('request: ' + xhr.responseText);
        // console.log(JSON.stringify(xhr.getAllResponseHeaders()));
        // console.log(dat, res, xhr);

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
    console.log('bound to: ', _urls.site)

    return { init: init };

}());
