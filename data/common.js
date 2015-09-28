
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

    byString = function (story, key) {
        return (story.data.join(' ').indexOf(key) != -1)
    },

    getFilteredTags = function() {
        _tags = [] // !!!! Does this work the way I think it does???
        $(_stories).each(function() {
            updateTags(this)
        })
        return filterTags()
    },

    extractBracketedTags = function(text) {
        var rx = /\[([^\]]+)\]/g, result = [],
        match = rx.exec(text);
        while (match != null) {
            result.push(match[1])
            // matched text: match[0]
            // match start: match.index
            // capturing group n: match[n]
            match = rx.exec(text);
        }
        return result;
    },

    loadStories = function() {
        _stories = [] // !!!! Does this work the way I think it does???
        $('.story-card-container').each(function() {

            // split on colon :
            var title = $.map($('.title', this).text().trim().split(':'), $.trim),
            story = $('.identity .number', this).text().trim(),
            status = $('.status', this).text().trim(),
            feature = (title[0].startsWith('E-')) ? title[0] : undefined,

            // extract text from inside brackets []
            tags = extractBracketedTags($('.title', this).text().trim())
            if (tags.length) {
                $(tags).each(function(i, v) { title.push(v); });
            }

            _stories.push({ 'node': this, 'feature': feature, 'story': story, 'status': status, data: title })
            if (status.toLowerCase() != 'delivered') { 

                // console.log(feature, story, status, title);

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
                if (!_selected.length) {
                     selectStory(byString, key)
                 }
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

var platform = (function () {
    var _private,
        _webkit,
        _mozilla,

    branchUrl = function () {
        if (_webkit) {
            return chrome.extension.getURL(config.branchUrl)
        } else {
            return self.options.branchUrl
        }
    },

    storageSet = function (value, callback) {
        if (_webkit) {
            chrome.storage.local.set(value, function(result) {
                // console.log(result)
                if (callback) { callback(result) }
            });
        } else {
            var keys = Object.keys(value), len = keys.length,
                key = keys[len - 1], json = JSON.stringify(value[key]);
            // console.log(value, keys, len, key, json)
            var result = localStorage.setItem(key, json),
            response = (result === null) ? {} : result;
            if (callback) { callback(response) }
        }
    },

    storageGet = function (key, callback) {
        if (_webkit) {
            chrome.storage.local.get(key, function(result) {
                if (callback) { callback(result) }
            });
        } else {
            var result = localStorage.getItem(key),
            response = (result === null) ? {} : result;
            if (callback) { callback(response) }
        }
    },

    gearUrl = function () {
        if (_webkit) {
            return chrome.extension.getURL(config.gearUrl)
        } else {
            return self.options.gearUrl
        }
    },

    plusUrl = function () {
        if (_webkit) {
            return chrome.extension.getURL(config.plusUrl)
        } else {
            return self.options.plusUrl
        }
    },


    init = function(platform) {
        _webkit = platform.hasOwnProperty('sendMessage');
        _mozilla = platform.hasOwnProperty('postMessage');
        console.log('isWebkit: ', _webkit, 'isMozilla: ',  _mozilla);
    };

    return {
        localStorage: localStorage,
        storage: { set: storageSet,
                   get: storageGet },
        urls: { branch: branchUrl,
                  plus: plusUrl,
                  gear: gearUrl },
        init: init
    };
}());

var config = (function () {
    var _private,
        _default = {
            version: "1.0.0"
        },
        $ = undefined,

    apply = function (config) {
        for (var attribute in config) { this[attribute] = config[attribute]; }
        var that = this

        platform.storage.get('config', function(result) {
            // console.log(result)

            if (Object.keys(result).length === 0) {
                console.log('config.apply: no local storage config found')
            } else {
                var local = result.config
                for (var attribute in local) { that[attribute] = local[attribute]; }
                // console.log(that)
            }
        });

        // console.log(this)
    },

    init = function(jq) {
        $ = jq
        platform.storage.get('config', function(result) {
            console.log(result)
            if (Object.keys(result).length === 0) {
                platform.storage.set({ config: _default });
            }
        });
    };

    return {
        apply: apply,
        init: init
    };
}());

var ui = (function () {
    var _private,
        _next_color,
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
        var result = '', x = 0;
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].id.length < 8) {
                result += '<i '.concat('class="tag" data-bg="', config.colors[x], '">', tags[i].id.trim(), '</i>');
                x++
            }
        };
        _next_color = x;
        return result;
    },
    createElements = function () {
        var html = '<div id="veenun" class="bootstrap-scoped container" >'.
            concat(ui.tagButtons(stories.tags()), getConfigMenu(), '</div>');

        $('.project-bar').append(html);

        $('#veenun .tag').on('click', onTagClick);
        // bind handlers to 'menu' events
        $('.dropdown-menu .menu-item').on('click', onConfigClick);
        $('.dropdown-menu li a').on('click', onConfigClick);
        $('#add-tag').on('click', onAddTag);

    },

    getConfigMenu = function (e) {
        // show the drop down menu...
        var dropdown = '<div class="dropdown">'.concat(
                '<span id="dropdown-target" class="dropdown-toggle" ',
                    'aria-haspopup="true" aria-expanded="false" data-toggle="dropdown" ',
                    'style="background-image: url(', platform.urls.gear(), ');"></span>',
                    //chrome-extension://__MSG_@@extension_id__/
                    // '<span class="caret"></span>',
                '<ul class="dropdown-menu dropdown-menu-right" aria-labelledby="dropdown-target">',
                    '<li><div class="menu-item" style="padding-right: 7px;">Add: ',
                        '<input type="text" id="tag-name" name="tag-name" class="inline" size="8" maxlength="8"/>',
                        '<span id="add-tag" style="background-image: url(', platform.urls.plus(), ');"></span>',
                    '</div></li>',
                    '<li><a data-handler="onShowAllTags" href="#">Show All Tags</a>',
                        '<span class="toggle off"></span></li>',
                    '<li><a data-handler="exposedFunctionName" href="#">Action</a></li>',
                    '<li><div class="menu-item">Menu Choice</div></li>',
                    '<li><a href="#">Another action</a></li>',
                    '<li><a href="#">Something else here</a></li>',
                '</ul>',
            '</div>');
        var result = '<div class="config-menu">'.concat(dropdown, '</div>')

        return result;
    },


    hasAttr = function (e, name) {
        var attr = $(e).attr(name);
        // For some browsers, `attr` is undefined; for others,
        // `attr` is false.  Check for both.
        return (typeof attr !== typeof undefined && attr !== false);
    },

    onAddTag = function (e) {
        console.log('onAddTag', e.target, $('#tag-name').val())
        var tag = '<i '.concat('class="tag" data-bg="', config.colors[_next_color], '">',  $('#tag-name').val(), '</i>');
        $("#veenun i.tag").siblings(":last").prev().after(tag);
        $("#veenun i.tag").siblings(":last").prev().on('click', onTagClick);
        _next_color++;
    },

    onConfigClick = function (e) {
        console.log('onConfigClick', e.target)
        
        if (hasAttr(e.target, 'data-handler')) {
            var handler = $(e.target).attr('data-handler'),
            callback = ui[handler];
            // TODO : Error handling for bad string, etc...
            if (callback) {
                callback();// exposed function name
            }
        }

        // select on arbitrary string
        // ui.cardColor('blueviolet', stories.find('SRP'));

        // Show menu with various choices

        // Show a dialog with various choices

        // return false; // -- false causes dropdown to stay open !!
    },

    onTagClick = function (e) {
        var t = $(e.target), txt = t.text(),
        selected = t.attr('data-selected') == 'true',
        color = (selected) ? 'white' : t.attr('data-bg');
        t.css('background-color', (!selected) ? color : 'inherit')
        ui.cardColor(color, stories.find(txt));

        // ui.cardIcons(stories.list(),
            // platform.urls.branch()))

        if (selected) {
            t.removeAttr('data-selected')
        } else {
            t.attr('data-selected', true)
        }
    },

    init = function(jq) {
        $ = jq
    };
    return {
        cardColor: setCardColor,
        tagButtons: generateButtons,
        cardIcons: addCardIcons,
        createElements: createElements,
        init: init
};
}());
