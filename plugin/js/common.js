
var stories = (function () {

    var _stories = [],
        _selected = [], 
        _tags = [],
        _branches = [],
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
        _tags = []
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

    getStoryNames = function() {
        var result = $.map(_stories, function(n) { return n.story; });
        return result.filter(function (n, i) {return result.indexOf(n) == i});
    },
    getFeatureNames = function() {
        var result = $.map(_stories, function(n) { return n.feature; });
        return result.filter(function (n, i) {return result.indexOf(n) == i});
    },

    loadStories = function() {
        _stories = []
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

    addStoryLogs = function(branch, logs) {
        _branches.push( { name: branch, data: logs } );
    },

    addFeatureLogs = function(branch, logs) {
        _branches.push( { name: branch, data: logs } );
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
        names: getStoryNames,
        features: getFeatureNames,
        storyLogs: addStoryLogs,
        featureLogs: addFeatureLogs,
        branchList: _branches,
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
            return self.options.branchUrl;
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

    storageClear = function (callback) {
        if (_webkit) {
            chrome.storage.local.clear();
            } else {
            localStorage.clear()
        }
        if (callback) { callback(response) }
    },

    storageGet = function (key, callback) {
        if (_webkit) {
            chrome.storage.local.get(key, function(result) {
                if (callback) { callback(result) }
            });
        } else {
            var result = localStorage.getItem(key),
            response = (result === null) ? { config: {} } : { config: JSON.parse(result) };
            if (callback) { callback(response) }
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
            response = (result === null) ? { config: {} } : { config: result };
            if (callback) { callback(response) }
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
                   get: storageGet,
                   clear: storageClear },
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

    apply = function (config, callback) {
        config = config || {}
        if (config.colors) { _defaultColors = config.colors; }
        for (var attribute in config) { this[attribute] = config[attribute]; }
        var that = this

        platform.storage.get('config', function(result) {
            if (Object.keys(result).length === 0) {
                console.log('config.apply: no local storage config found')
            } else {
                var local = result.config
                // console.log('config.found', local)
                
                for (var attribute in local) {
                    if (local[attribute])
                    that[attribute] = local[attribute];
                }
            }
            // console.log('config.apply', that);
            if (callback) { callback(); }
        });
    },

    hasTags = function() {
        return this.tags.length > 0
    },

    hasColors = function() {
        for (var i = 0; i < this.colors.length; i++) {
            if (_defaultColors.indexOf(this.colors[i]) < 0) { break; };
        };
        var result = !((this.colors.length === _defaultColors.length) && ( i == this.colors.length));
        return result;
    },

    clear = function() {
        platform.storage.clear()
    },

    save = function(callback) {
        var that = {}, keys = Object.keys(this);
        for (var i = keys.length - 1; i >= 0; i--) {
            var attribute = keys[i];
            if (typeof this[attribute] != "function") {
                that[attribute] = this[attribute];
            }
        };
        var config = { config: that };
        platform.storage.set(config, callback);
    },

    init = function(jq) {
        $ = jq
        platform.storage.get('config', function(result) {
            // console.log('config.init', result.config)
            if (Object.keys(result).length === 0) {
                platform.storage.set({ config: _default });
            }
        });
    };

    return {
        apply: apply,
        defaultColors: _defaultColors,
        save: save,
        hasTags: hasTags,
        hasColors: hasColors,
        clear: clear,
        init: init
    };
}());

var ui = (function () {
    var _private,
        _map = null,
        _nextColor,
        _tagColor,
        _template = '',
        _pickerOpen = false,
        $ = undefined,

    setCardColor = function (color, stories) {
        $(stories).each(function() {
            $('.story-card', this.node).css('background-color', color)
        });
    },

    addCardIcons = function (list, url) {
        url = url || platform.urls.branch();

        var commitDetails = function(commits) {

            var gitLabBaseUrl = 'https://gitlab.amer.gettywan.com/istock/istock/commits/'; // !!! From config!!!

            var result = [], now = Date.parse(new Date());
            for (var i = 0; i < commits.length; i++) {
                var c = commits[i],
                then = Date.parse(c.date),
                data = {
                    giturl: gitLabBaseUrl+ c.commit,
                    linkname: c.commit.substr(0, 8),
                    days: Math.floor((now - then) / 1000 / 60 / 60 / 24),
                    author: c.author.split(' ', 1)[0]
                };
                result.push(data)
            };
            return result;            
        }

        $(list).each(function(i, branch) {
            var story = stories.find(branch.name)[0], 
            node = $(story.node),
            data = {
                title: branch.data.branch,
                id: branch.data.branch.replace(/\//g , "-").toLowerCase(),
                url: url,
                commits: renderMarkup('#commit', commitDetails(branch.data.commits))
            };
            node.append(renderMarkup('#popover', data));
        });

        $("[data-toggle=popover]").popover( {
            html: true,
            content: function() {
                var id = $(this).attr('data-markup')
                return $('#'.concat(id)).html()
            },
        });
    },

    getTagList = function(tags) {
        var result = [],
        list = tags || getAllTags();
        $(list).each(function(i, item) {
            var tag = item.id.trim(), spaceAt = tag.indexOf(' '),
            tagName = (spaceAt > -1) ? tag.substr(0, spaceAt) : tag;
            result.push({ color: config.colors[i], tag: tagName });
        });
        _nextColor = list.length;
        return result;
    },

    getAllTags = function () {
        var result = []
        $(config.tags).each(function() {
            result.push({ id: this, count: -1 })
        })
        return stories.tags().concat(result);
    },

    templateMap = function () {
        var aggregator = function (d, v, t) {
            return [d.buttons, d.menu, d.color].join(' ');
        };
        if (!_map) {
            _map = Plates.Map();
            _map.where('style').has('#gear').insert('gear');
            _map.where('style').has('#plus').insert('plus');
            _map.where('data-bg').has('#color').insert('color');
            _map.where('class').is('tag').use('tag');
            _map.where('id').is('veenun').use(aggregator);

            _map.where('title').has('#title').insert('title');
            _map.where('data-title').has('#title').insert('title');
            _map.where('data-content').has('#commits').insert('commits');
            _map.where('data-content').has('#id').insert('id');
            _map.where('src').has('#url').insert('url');
            _map.class('commits').use('id').as('id');
            _map.class('commits').use('commits');

            _map.where('href').has('#giturl').insert('giturl');
            _map.class('linkname').use('linkname');
            _map.class('days').use('days');
            _map.class('author').use('author');
        }
        return _map
    },

    renderMarkup = function (selector, content) {
        var markup = $(selector, _template).html()
        // console.log(content, templateMap(), markup);
        return Plates.bind(markup, content, templateMap());
    },

    loadTemplate = function (callback) {
        var done = callback || function(response) { _template = response; }
        $.get(chrome.extension.getURL(config.template), done)
    },

    createElements = function () {
        loadTemplate(function (response) {
            _template = response
            var html = renderMarkup("#main", {
                buttons: renderMarkup('#taglist', getTagList()),
                menu: renderMarkup('#menu', {
                    plus: 'url('.concat(platform.urls.plus(), ');'),
                    gear: 'url('.concat(platform.urls.gear(), ');')
                }),
                color: renderMarkup('#color', {})
            });

            $('.project-bar').append(html);

            bindHandlers();
        });
    },

    enableConfigMenus = function () {
        var enabledMenus = {
            'clearCustomColors' : config.hasColors(),
            'clearCustomTags':    config.hasTags(),
            'showStoryBranches' : stories.branchList.length > 0
        }
        $('.dropdown-menu li').each(function(i, n) {
            var name = $('a', n).attr('data-handler');
            if (typeof enabledMenus[name] === 'boolean') {
                if (enabledMenus[name]) {
                    $(n).removeClass('disabled');
                }
            }
        })
    },

    bindHandlers = function () {
        // bind handlers to 'tag' clicks
        $('#veenun .tag').on('click', onTagClick);

        // bind handlers to 'menu' events
        $('.dropdown-menu .menu-item').on('click', onConfigClick);
        $('.dropdown-menu li a').on('click', onConfigClick);
        $('#add-tag').on('click', onAddTag);

        // enable menu items as appropriate
        $('.config-menu .dropdown').on('show.bs.dropdown', enableConfigMenus);

        // key handlers for embedded input
        $('#tag-name').on('keyup', function(e) {
            if (e.keyCode === 27) { $('.dropdown-toggle').dropdown('toggle'); }
            if (e.keyCode === 13) { onAddTag(e) }
        });

        // initialize color picker
        $("#color-input").spectrum({
            flat: true, showButtons: false,
            move: onColorChanged
        });

        // bind handlers to 'color-picker' events
        $('.color-select').on('click', onColorPickerSelect);
        $('.color-cancel').on('click', onColorPickerCancel);
        $(document).bind("keydown.spectrum", function(e) {
            if (_pickerOpen && e.keyCode === 27) {
                onColorPickerCancel()
            }
        });
    },

    onAddTag = function (e) {
        var tagName = $('#tag-name').val(),
        lastTag = function () { return $("#veenun i.tag").siblings(".config-menu").prev(); }; 
        if (tagName != ''){
            lastTag().after(renderMarkup('#tag', { color: config.colors[_nextColor], tag: tagName }));
            lastTag().on('click', onTagClick);
            if (!config.tags) {config.tags = []}
            config.tags.push(tagName)
            config.save(function() {
                $('#tag-name').val('');
                _nextColor++;
            })
        }
    },

    onColorPickerSelect = function() {
        var color = $("#color-input").spectrum("get"),
        selected = color.toHexString(),
        index = config.colors.indexOf(_tagColor),
        bgAttribute = $($('#veenun i.tag')[index]).attr('data-bg');
        if (index === -1) {
            // assumes the current tag is one past the end of the color array
            config.colors.push(selected);
            // How /when does the data-bg attr get updated?
        } else {
            config.colors[index] = selected;
            $($('#veenun i.tag')[index]).attr('data-bg', selected);
        }
        console.log('onColorPickerSelect', selected, _tagColor, config.colors, index, bgAttribute);

        config.save(function() {
            onColorPickerCancel();
            console.log('saved!')
        });
    },

    onColorChanged = function (color) {
        var hex = color.toHexString(),
        index = config.colors.indexOf(_tagColor);
        $($('#veenun i.tag')[index]).css('background-color', hex)
    },

    onColorPickerCancel = function (e) {
        $("#veenun i.tag").css('background-color', 'inherit');
        var tagLeft = $($('#veenun i.tag')[0]).position().left;
        $("#color-select").css("left", tagLeft);

        _pickerOpen = false;
        $('#color-select').css('display', 'none');
    },

    onConfigClick = function (e) {
        console.log('onConfigClick', e.target)
        var hasAttr = function (e, name) {
            var attr = $(e).attr(name);
            // For some browsers, `attr` is undefined; for others,
            // `attr` is false.  Check for both.
            return (typeof attr !== typeof undefined && attr !== false);
        };

        // maps markup attribute value to object method name
        if (hasAttr(e.target, 'data-handler')) {
            var handler = $(e.target).attr('data-handler'),
            callback = ui[handler];
            // TODO : Error handling for bad string, etc...
            if (callback) {
                callback();// exposed function name
            }
        }
        // return false; // -- false causes dropdown to stay open !!
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
            setCardColor(color, stories.find(txt));

            if (selected) {
                t.removeAttr('data-selected')
            } else {
                t.attr('data-selected', true)
            }
        }
    },

    // ========== // ========== // ==========

    clearCustomAll = function (e) {
        config.clear();
        config.apply(); // ??
    },

    clearCustomColors = function (e) {
        config.colors = config.defaultColors
        config.save()
    },

    clearCustomTags = function (e) {
        config.tags = []
        config.save()
    },

    showStoryBranches = function (e) {

        addCardIcons(stories.branchList);
    },

    showColorSelect = function (e) {
        var firstTag = $($('#veenun i.tag')[0]);
        _tagColor = firstTag.attr('data-bg');

        $("#veenun i.tag[data-selected='true']").each(function() {
            $(this).removeAttr('data-selected');
            $(this).css('background-color', 'inherit');
            setCardColor('white', stories.find($(this).text()));
        })

        firstTag.css('background-color', _tagColor);
        $("#color-input").spectrum("set", _tagColor);
        $('#color-select').css('display', 'block');

        _pickerOpen = true;
    },

    init = function(jq) {
        $ = jq
    };
    return {
        clearCustomColors: clearCustomColors,
        clearCustomTags: clearCustomTags,
        showStoryBranches: showStoryBranches,
        showColorSelect: showColorSelect,

        createElements: createElements,
        init: init
    };
}());
