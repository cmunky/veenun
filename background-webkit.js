
var service = (function () {

    var _private,
        _lastTabId,
        _options = {
          remote: "http://wintermute:23230",
          site: chrome.runtime.getManifest().content_scripts[0]["matches"][0],
          template: chrome.extension.getURL("./data/template.html")
        },

    loadTemplates = function() {
        $.get(_options.template, function(response) {

            console.log(response)

        })
    },

    onInitialize = function() {
        chrome.tabs.query( { active: true, currentWindow: true}, function(tabs) {
          if (tabs.length) {
            _lastTabId = tabs[0].id;
            sendMessage({ status : 200, message: "Initialized" });
          }
        });
    },

    sendMessage = function(msg) {
      if (_lastTabId < 0)
          initialize()
      else
          chrome.tabs.sendMessage(_lastTabId, msg );
    },

    backgroundListener = function(msg, _, sendResponse) {
      if (msg.setAlarm) {
          timeout = msg.timeout || 10; // minutes
          chrome.alarms.create( { delayInMinutes: timeout } );

      } else if (msg.init) {

          onInitialize()

      } else { // unknown messages
          console.log('background-listener: ', JSON.stringify(msg), _, sendResponse);
      }
    },

    alarmListener = function(msg) {
        console.log("alarm-listener : timer expired!", msg);
        
        // loadTemplates()
        
        sendMessage({ loadStories: true });  

        /*$.get(_options.remote, function(dat, res, xhr) {
            console.log('request: ' + xhr.responseText);
            // console.log(JSON.stringify(xhr.getAllResponseHeaders()));
            // console.log(dat, res, xhr);

            sendMessage({ remoteResponse: true, data: xhr.responseText });
            
        });*/
    },

    init = function() {

    };

    chrome.runtime.onMessage.addListener(backgroundListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
    console.log('bound to: ', _options.site)

    return {
        init: init
    };
}());