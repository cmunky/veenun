
var veeNone = (function ($, $app) {
    var _private,

    debugCreateElements = function () {
        var html = '<div id="foo" class="tag-filter" >'.
            concat(ui.tagButtons(stories.tags()), '</div>');

        $('.project-bar').append(html);
        $('.project-bar #foo .tag').on('click', onTagClick);
    },


    onLoadStories = function() {
        stories.load();
    },

    onTagClick = function (e) {
        var t = $(e.target), txt = t.text(),
        selected = t.attr('data-selected') == 'true',
        color = (selected) ? 'white' : t.attr('data-bg');
        t.css('background-color', (!selected) ? color : 'inherit')
        ui.cardColor(color, stories.find(txt));

        // ui.cardIcons(stories.list(),
            // chrome.extension.getURL(config.branchUrl))

        if (selected) {
            t.removeAttr('data-selected')
        } else {
            t.attr('data-selected', true)
        }
    },

    pageListener = function (msg, _, sendResponse) {
        if (msg.remoteResponse) {
            console.log("remoteResponse: " + msg.data);

            // *** RELOAD PAGE ***
            //location.reload()

        } else if (msg.configLoaded) {

            config.apply(msg.config);

            console.log(config)

            // The ui library relies on config for colors
            debugCreateElements();

        } else if (msg.initComplete) {

            $app.sendMessage({ loadConfig: true });

            $app.sendMessage({ setAlarm: true, timeout: 0.2 }); // 20 seconds (debug only)

            onLoadStories();

            // debugCreateElements();

        } else if (msg.loadStories) {

            // onLoadStories()

            // debugCreateElements()

        } else { // unknown messages
            console.log("page-listener: " + JSON.stringify(msg), _, sendResponse);
        }
    },

    init = function() {
        stories.init($);
        ui.init($);
        config.init($);

        $app.sendMessage({ init: true });

    };

    $app.onMessage.addListener(pageListener);

    return {
        init: init
    };

}($, chrome.runtime));
$(function() { veeNone.init(); });
