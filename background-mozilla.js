
var service = (function () {

    var events = require("./data/events.js"),
        pageMod = require("sdk/page-mod"),
        Request = require("sdk/request").Request,
        resource = require("sdk/self").data,
        options = {
            remote: "http://wintermute:23230",
            site:  "https://www13.v1host.com/GettyImagesEnterprise/*"
        },

    loadTemplates = function() {
        var file = resource.load(resource.url("template.html"))
        console.log('template: ', file)
    },

    onRequestComplete = function (response) {
        console.log('[background] request: ' + response.text)
         
        for (var headerName in response.headers) {
            console.log(headerName + " : " + response.headers[headerName]);
        }

        events.sendMessage("remoteResponse", { data: response.text } )
    },

    getRequest = function(url) {
        return Request({
            url: url || options.remote, 
            onComplete: onRequestComplete
        })
    },

    onInit = function() {
        console.log('[background] init handler: ');
        
        events.sendMessage("initComplete")
    },

    onTimeoutExpired = function() {
        console.log('[background] timeoutExpired handler: ');
        
        // loadTemplates()
        
        events.sendMessage("loadStories" )

        // Inits a request and fetches data from the default URL... needs refactoring
        
        // getRequest().get()
        
    },

    startListening = function(worker) {
        events.initialize(worker.port);
        events.addListener('timeoutExpired', onTimeoutExpired);
        events.addListener('init', onInit);
    },

    init = function() {

    };

    pageMod.PageMod({
        include: options.site,
        contentStyleFile: ["./style.css"],
        contentScriptFile: ["./jquery.min.js", "./events.js", "./common.js", "./page-firefox.js" ],
        contentScriptOptions: {
            branchUrl: resource.url("branch-32.png")
        },
        onAttach: startListening
    });

    console.log('bound to: ', options.site);

    return {
        init: init
    };

}());
