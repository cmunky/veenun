
$events = self.port

var veeNone = (function ($, $events) {
    var _private, 

    onLoadStories = function() {

        stories.load()

        debugCreateElements()

    },

    onRemoteResponse = function(response) {
        console.log("remoteResponse: " + JSON.stringify(response));

        // *** RELOAD PAGE ***
        //window.location.reload(); 
    },

    onInitComplete = function() {
        console.log("onInitComplete")

        setAlarm((20 * 1000)) // 20 seconds (debug only)

        onLoadStories()

        // debugCreateElements()
    },

    onTagClick = function(e) {
        var t = $(e.target), txt = t.text(),
        selected = t.attr('data-selected') == 'true',
        color = (selected) ? 'white' : t.attr('data-bg');

        ui.cardColor(color, stories.find(txt))

        // ui.cardIcons(stories.list(), self.options.branchUrl)

        if (selected) {
            t.removeAttr('data-selected')      
        } else {
            t.attr('data-selected', true)
        }
    },

    debugCreateElements = function() {
        var html = '<div id="foo" class="tag-filter" >'.
            concat(ui.tagButtons(stories.tags()), '</div>')

        $('.project-bar').append(html)
        $('.project-bar #foo .tag').on('click', onTagClick)
    },

    init = function() {
        
        stories.init($)
        ui.init($)

        console.log($('title').text())
        console.log('veeNone init')

        sendMessage('init');
    };

    addListener("remoteResponse", onRemoteResponse);
    addListener("loadStories", onLoadStories);
    addListener("initComplete", onInitComplete);

    return {
        init: init
};
}($, self.port));

$(function() { veeNone.init(); });