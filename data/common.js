
var stories = (function () {

    var _stories = [],
        _selected = [], 
        _tags = [],
        $ = undefined,

    filterTags = function() {
        for (var i = _tags.length - 1; i >= 0; i--) {
            if (_tags[i].count === 1) { _tags.splice(i, 1) }
        }
        return _tags
    },

    updateTags = function(story) {
        for (var i = story.data.length - 1; i >= 0; i--) {           
            var tag = $.grep(_tags, function(e){ return e.id == story.data[i]; });
            if (tag.length == 0) {
                _tags.push({ 'id': story.data[i], 'count': 1})
            } else if (tag.length == 1) {
                tag[0].count += 1
            } else {
                console.log('multiple tag error - ' + tag[0])
            }
        };
    },

    selectStory = function (callback, key) {
        if (callback && !_selected.length) {
            $(_stories).each(function() {
                if (callback(this, key)) {
                    _selected.push(this)
                }
            });
        }
    },

    byTagName = function (story, key) {
        return (story.data.indexOf(key) >= 0);
    },

    byFeature = function (story, key) {
        return (story.feature === key);    
    },
    
    byStory = function (story, key) {
        return (story.story === key);
    },

    getFilteredTags = function() {
        _tags = [] // !!!! Does this work the way I think it does???
        $(_stories).each(function() {
            updateTags(this)
        })
        return filterTags()
    },

    loadStories = function() {
        _stories = [] // !!!! Does this work the way I think it does???
        $('.story-card-container').each(function() {
            var title = $.map($('.title', this).text().trim().split(':'), $.trim),
            story = $('.identity .number', this).text().trim(),
            status = $('.status', this).text().trim(),
            feature = (title[0].startsWith('E-')) ? title[0] : undefined;
            _stories.push({ 'node': this, 'feature': feature, 'story': story, 'status': status, data: title })
            if (status.toLowerCase() != 'delivered') { 
                console.log('[obj]', feature, story, status, title); 
            }
        });

    },

    getStory = function(key) {
        // will find a story by number, feature, or tag
        _selected = [] // !!!! Does this work the way I think it does???
        selectStory(byTagName, key)
        if (!_selected.length) {
            selectStory(byFeature, key)
            if (!_selected.length) {
                 selectStory(byStory, key)
            }
        }
        return (_selected.length == 0) ? null : _selected;
    },

    getTags = function() { 
        return getFilteredTags()
    },

    getStories = function() { 
        return _stories; 
    },

    init = function(jq) {
        $ = jq
        loadStories()
    };
    return {
        find: getStory,
        tags: getTags,
        list: getStories,
        load: loadStories,
        init: init
};
}());

var ui = (function () {
    var _private,
        $ = undefined,

    setCardColor = function (color, stories) {
        $(stories).each(function() {
            $('.story-card', this.node).css('background-color', color)
        });
    },

    addCardIcons = function (stories, url) {
        url = url || '';
        $(stories).each(function() {
            var node = $(this.node), 
            tab = ($('.bottom-card-tab', node).length < 1) ? '<div class="bottom-card-tab">!</div>' : '';
            // TODO: Check if this story / feature has a branch (local/remote/???)
            node.append(tab.concat('<img class="branch" src="', url, '" alt="branch">'))            
        });
    },

    generateButtons = function(tags) {
        var result = '', x = 0, c = ['red', 'blue', 'green', 'yellow', 'orange', 'brown'];
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].id.length < 8) {
                result += '<i '.concat('class="tag" data-bg="', c[x], '">', tags[i].id.trim(), '</i>')
                x++
            }
        };
        return result;
    },

    init = function(jq) {
        $ = jq
    };
    return {
        cardColor: setCardColor,
        tagButtons: generateButtons,
        cardIcons: addCardIcons,
        init: init
};
}());
