
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
            data = $.map($('.title', this).text().trim().split(':'), $.trim),
            // extract fields by class name
            story = $('.identity .number', this).text().trim(),
            status = $('.status', this).text().trim(),
            // extract feature from title
            // TODO: This logic only works for SEO, other teams are different !?!
            feature = (data[0].startsWith('E-')) ? data[0] : undefined,
            // extract text from inside brackets []
            tags = extractBracketedTags($('.title', this).text().trim());
            if (tags.length) {
                $(tags).each(function(i, v) {
                    data.unshift(v) // insert the bracket tags are the start of the array
                });
            }

            _stories.push({ 'node': this, 'feature': feature, 'story': story, 'status': status, data: data })

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
