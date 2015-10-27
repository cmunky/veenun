module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),  
        buildConfig: {
            path: "./plugin/",
            mozilla: { 
                config: { file: "data/config-mozilla.json" },
                package: { file: "package.json" }
            },
            webkit: { 
                config: { file: "data/config-webkit.json" }, 
                package: { file: "manifest.json" } 
            }
        },
        "jsbeautifier" : {
            files : ["plugin/**/*.json", "./package.json"],
            options : {}
        }
    });

    grunt.loadNpmTasks("grunt-jsbeautifier");

    grunt.registerTask('default', ['buildConfig', 'jsbeautifier']);

    grunt.registerTask('buildConfig', 'Build veenun plugin configuration for Chrome and Webkit ', function() {
        var 
            cfg = grunt.config(this.name),
            pkg = grunt.config('pkg'),
            options = pkg[this.name];

        var prefix = function(list, prefix) {
            result = [];
            for (var i = 0; i < list.length; i++) {
                result.push(prefix.concat(list[i]))
            };
            return result
        }
        var prefixOptions = function(img, dat) {
            var result = {}
            Object.keys(options.shared.options).forEach(function(key) {
                if (['branchUrl', 'gearUrl', 'plusUrl'].indexOf(key) != -1) {
                    result[key] = img + options.shared.options[key]
                } else if (['template'].indexOf(key) != -1) {
                    result[key] = dat + options.shared.options[key]
                } else { 
                    result[key] = options.shared.options[key]
                }
            });
            return result;
        }
        var extract = function (browserOpt, exclude) {
            exclude = exclude || ['pkg', 'script']
            var result = {}
            for (var i = 0; i < browserOpt.pkg.length; i++) {
                var n = browserOpt.pkg[i]
                result[n] = pkg[n]
            };

            Object.keys(browserOpt).forEach(function(key) {
                if (exclude.indexOf(key) < 0) {
                    result[key] = browserOpt[key]
                }
            });
            return result
        }
        var save = function(file, content) {
            grunt.file.write(cfg.path.concat(file), JSON.stringify(content) );
        }

        var packageJs = extract(options.mozilla);
        packageJs.title = packageJs.name
        save(cfg.mozilla.package.file, packageJs)

        save(cfg.mozilla.config.file, {
            include: options.shared.target[0],
            contentStyleFile: prefix(options.shared.style, './../css/'),
            contentScriptFile: prefix(options.shared.script.concat(options.mozilla.script), './../js/'),
            contentScriptOptions: prefixOptions('../img/', './data/')
        });

        var manifestJs = extract(options.webkit);
        manifestJs.content_scripts = [{
            matches: options.shared.target,
            css: prefix(options.shared.style, './css/'),
            js: prefix(options.shared.script.concat(options.webkit.script), './js/'),
        }]
        save(cfg.webkit.package.file, manifestJs)

        save(cfg.webkit.config.file, prefixOptions('./img/', './data/'));
    });
};
