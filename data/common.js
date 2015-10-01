
var stories = (function () {

    var _stories = [],
        _selected = [], 
        _tags = [],
        $ = undefined,

    filterTags = function() {
        for (var i = _tags.length - 1; i >= 0; i--) {
            if (_tags[i].count === 1) {
                _tags.splice(i, 1)
            }
        }
        return _tags
    },

    updateTags = function(story) {
        for (var i = story.data.length - 1; i >= 0; i--) {           
            var tag = $.grep(_tags, function(e){
                return e.id == story.data[i];
            });
            if (tag.length === 0) {
                if (story.data.length > 1 && i === 0) {
                    // This only adds the first tag, potentially missing secondary groupings
                    // TODO: How do we know a string is 'tag-like' or if it's simply story text
                    _tags.push({ 'id': story.data[i], 'count': 1})
                }
            } else {
                if (tag.length > 1) {
                    console.log('multiple tag error - ' + tag.join(', '));
                } else {
                    tag[0].count += 1
                }
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
        result = filterTags()
        return result
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
            var 
            // split on colon :
            title = $.map($('.title', this).text().trim().split(':'), $.trim),
            // extract fields by class name
            story = $('.identity .number', this).text().trim(),
            status = $('.status', this).text().trim(),
            // extract feature from title
            // TODO: This logic only works for SEO, other teams are different !?!
            feature = (title[0].startsWith('E-')) ? title[0] : undefined,
            // extract text from inside brackets []
            tags = extractBracketedTags($('.title', this).text().trim());
            if (tags.length) {
                $(tags).each(function(i, v) {
                    title.unshift(v) // insert the bracket tags are the start of the array
                });
            }

            _stories.push({ 'node': this, 'feature': feature, 'story': story, 'status': status, data: title })

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
        _defaultColors = [],
        _default = {
            version: "1.0.0"
        },
        $ = undefined,

    apply = function (config) {
        config = config || {}
        for (var attribute in config) { this[attribute] = config[attribute]; }
        var that = this

        platform.storage.get('config', function(result) {
            // console.log(result)

            if (Object.keys(result).length === 0) {
                console.log('config.apply: no local storage config found')
            } else {
                var local = result.config
                console.log(local)
                
                for (var attribute in local) { that[attribute] = local[attribute]; }
                // console.log(that)
            }
        });

        console.log('config.apply', this);
    },

    save = function() {
        var that = {}, keys = Object.keys(this);
        for (var i = keys.length - 1; i >= 0; i--) {
            var attribute = keys[i];
            if (typeof this[attribute] != "function") {
                that[attribute] = this[attribute];
            }
        };
        var config = { config: that };
        platform.storage.set(config);
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
        defaultColors: _defaultColors,
        save: save,
        init: init
    };
}());

var ui = (function () {
    var _private,
        _nextColor,
        _tagColor,
        _pickerOpen = false,
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
            var trim = tags[i].id.trim();
            tagName = trim.indexOf(' ') > -1 ? trim.substr(0, trim.indexOf(' ')) : trim;
            result += '<i '.concat('class="tag" data-bg="', config.colors[x], '">', tagName, '</i>');
            x++
            // if (tags[i].id.length < 8) {
            //     result += '<i '.concat('class="tag" data-bg="', config.colors[x], '">', tags[i].id.trim(), '</i>');
            //     x++
            // }
        };
        _nextColor = x;
        return result;
    },
    createElements = function () {
        var html = '<div id="veenun" class="bootstrap-scoped container" >'.
            concat(ui.tagButtons(stories.tags()), getConfigMenu(), getColorPicker(), '</div>');

        $('.project-bar').append(html);

        $('#veenun .tag').on('click', onTagClick);

        // bind handlers to 'menu' events
        $('.dropdown-menu .menu-item').on('click', onConfigClick);
        $('.dropdown-menu li a').on('click', onConfigClick);
        $('#add-tag').on('click', onAddTag);
        // key handlers for embedded input
        $('#tag-name').on('keyup', function(e) {
            if (e.keyCode === 27) { $('.dropdown-toggle').dropdown('toggle'); }
            if (e.keyCode === 13) { onAddTag(e) }
        });

        $("#color-input").spectrum({
            flat: true, showButtons: false,
            move: onColorChanged
        });
        // bind handlers to 'color-picker' events
        $('.color-cancel').on('click', onColorPickerCancel);
        $('.color-select').on('click', onColorPickerSelect);
        $(document).bind("keydown.spectrum", onColorPickerCancel);
    },

    getColorPicker = function (e) {
        return '<div id="color-select">'.concat(

            '<input type="text" id="color-input" />',
                "<div class='button-container'>",
                    "<button type='button' class='color-cancel'>Cancel</button>",
                    "<button type='button' class='color-select'>Select</button>",
                "</div>",
            '</div>');
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
                    '<li><a data-handler="showColorSelect"  href="#">Select Colors</a></li>',
                    '<li><a data-handler="clearCustomColors" href="#">Clear Custom Colors</a></li>',
                    '<li><a data-handler="clearCustomTags" href="#">Clear Custom Tags</a></li>',

                    // '<li><a data-handler="exposedFunctionName" href="#">Action</a></li>',
                    // '<li><div class="menu-item">Menu Choice</div></li>',
                    // '<li><a href="#">Something else here</a></li>',
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
        var tag = '<i '.concat('class="tag" data-bg="', config.colors[_nextColor], '">',  $('#tag-name').val(), '</i>');
        $("#veenun i.tag").siblings(".config-menu").prev().after(tag);
        $("#veenun i.tag").siblings(".config-menu").prev().on('click', onTagClick);
        $('#tag-name').val('');
        _nextColor++;
    },

    onColorPickerSelect = function() {
        var color = $("#color-input").spectrum("get"),
        prev = _tagColor,
        selected = color.toHexString(),
        all = config.colors,
        found = all.indexOf(prev),
        add = (found === -1), tagBg;
        if (add) {
            all.push(selected);
        } else {
            tagBg = $($('#veenun i.tag')[found]).attr('data-bg');
            all[found] = selected;
            $($('#veenun i.tag')[found]).attr('data-bg', selected);
        }

        console.log('onColorPickerSelect', selected, prev, all, found, add, tagBg);

        config.save();
        // TODO: Update the color array and save the changes to local storage

        onColorPickerCancel();
    },

    onColorChanged = function (color) {

    },

    onColorPickerCancel = function (e) {
        $("#veenun i.tag").css('background-color', 'inherit');
        var tagLeft = $($('#veenun i.tag')[0]).position().left;
        $("#color-select").css("left", tagLeft);

        _pickerOpen = false;
        $('#color-select').css('display', 'none');
    },

    clearCustomColors = function (e) {
        config.colors = config.defaultColors
    },

    clearCustomTags = function (e) {
        config.tags = []
    },

    moreUsefulEventHandlers = function (e) {},

    showColorSelect = function (e) {
        var firstTag = $($('#veenun i.tag')[0]);
        _tagColor = firstTag.attr('data-bg');

        $("#veenun i.tag[data-selected='true']").each(function() {
            $(this).removeAttr('data-selected');
            $(this).css('background-color', 'inherit');
            ui.cardColor('white', stories.find($(this).text()));
        })

        firstTag.css('background-color', _tagColor);
        $("#color-input").spectrum("set", _tagColor);
        $('#color-select').css('display', 'block');

        _pickerOpen = true;
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

    addStoryBranches = function (e) {
        ui.cardIcons(stories.list(),
            platform.urls.branch());
    },

    onTagClick = function (e) {
        var t = $(e.target);

        if (_pickerOpen) {
            var pickerLeft = function(t) {
                var tagPos = t.position(), borderMargin = 12, 
                pickerWidth = $("#color-select").width();
                return (tagPos.left >= ($(document).width() - pickerWidth)) ? 
                    tagPos.left + t.width() + borderMargin - pickerWidth :
                    tagPos.left;
            };
            _tagColor = t.attr('data-bg');
            $("i.tag").css('background-color', 'inherit');
            $("#color-input").spectrum("set", _tagColor );
            $("#color-select").css("left", pickerLeft(t));
            t.css('background-color', _tagColor )
        } else {
            // TODO This should be refactored to a method...
            var txt = t.text(),
            selected = t.attr('data-selected') == 'true',
            color = (selected) ? 'white' : t.attr('data-bg');

            t.css('background-color', (!selected) ? color : 'inherit')
            ui.cardColor(color, stories.find(txt));

            if (selected) {
                t.removeAttr('data-selected')
            } else {
                t.attr('data-selected', true)
            }
        }
    },

    init = function(jq) {
        $ = jq
    };
    return {
        showColorSelect: showColorSelect,
        clearCustomColors: clearCustomColors,
        clearCustomTags: clearCustomTags,
        cardColor: setCardColor,
        tagButtons: generateButtons,
        cardIcons: addCardIcons,
        createElements: createElements,
        init: init
};
}());
