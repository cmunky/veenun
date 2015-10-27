
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
        index = config.colors.indexOf(_tagColor);

        if (index === -1) {
            // assumes the current tag is one past the end of the color array
            config.colors.push(selected);
            // How /when does the data-bg attr get updated?
        } else {
            config.colors[index] = selected;
            $($('#veenun i.tag')[index]).attr('data-bg', selected);
        }
        // console.log('onColorPickerSelect', selected, _tagColor, config.colors, index);

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
        // console.log('onConfigClick', e.target)
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
            t.css('background-color', _tagColor )

            $("#veenun i.tag").css('background-color', 'inherit');
            $("#color-input").spectrum("set", _tagColor );
            $("#color-select").css("left", pickerLeft(t));
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
