
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

    timeout = function () {
        var value = _webkit ? config.timeout : self.options.timeout
        if (value) {
            var rx = /(\d+)(m|h|s)/g,
            match = rx.exec(value),
            val = match[1], uom = match[2],
            factor = { 's' : 1, 'm': 60, 'h': (60 * 60)};
            if (_webkit) {
                return (val * factor[uom]) / 60 ;
            } else {
                return (val * factor[uom]) * 1000;
            }
        }
        // TODO: Should there be a default if config doesn't exist / isn't loaded ???
    },

    init = function(platform) {
        _webkit = platform.hasOwnProperty('sendMessage');
        _mozilla = platform.hasOwnProperty('postMessage');
        console.log('isWebkit: ', _webkit, 'isMozilla: ',  _mozilla);
    };

    return {
        localStorage: localStorage,
        timeout: timeout,
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
        return (this.tags != undefined) && (this.tags.length > 0);
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
