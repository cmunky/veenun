module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),  
        buildConfig: {
            path: "./plugin/",
            exclusions: ['pkg', 'script'],
            libFiles:  ['bootstrap.min.js', 'jquery.min.js', 'plates.js', 'spectrum.js'],
            imageKeys: ['branchUrl', 'gearUrl', 'plusUrl'],
            dataKeys:  ['template'],
            mozilla: { 
                config: { file: "data/config-mozilla.json" },
                package: { file: "package.json" }
            },
            webkit: { 
                config: { file: "data/config-webkit.json" }, 
                package: { file: "manifest.json" } 
            }
        },
        shell : {
            noop:  { command: 'echo ""' },
            build: { command: './dist/build.sh' },
            clean: { command: 'rm ./dist/veenun.crx ./dist/@veenun-*.xpi' }
        },
        "jsbeautifier" : {
            files : ["plugin/**/*.json", "./package.json"],
            options : {}
        }
    });

    grunt.loadNpmTasks("grunt-jsbeautifier");
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('packagePlugins', ['shell:noop']);
    // grunt.registerTask('packagePlugins', ['shell:clean', 'shell:build']);

    grunt.registerTask('default', ['buildConfig', 'jsbeautifier', 'packagePlugins']);

    grunt.registerTask('clean', ['shell:clean']);
    grunt.registerTask('build', ['shell:build']);
    grunt.registerTask('config', ['buildConfig']);
    grunt.registerTask('tidy', ['jsbeautifier']);

    grunt.registerTask('buildConfig', 'Build veenun plugin configuration for Chrome and Webkit ', function() {
        var 
            cfg = grunt.config(this.name),
            pkg = grunt.config('pkg'),
            options = pkg[this.name];

        var prefix = function(list, prefix) {
            result = [];
            for (var i = 0; i < list.length; i++) {
                var infix = (cfg.libFiles.indexOf(list[i]) != -1) ? 'lib/' : ''
                result.push(prefix.concat(infix, list[i]))
            };
            return result
        }
        var prefixOptions = function(img, dat) {
            var result = {}
            Object.keys(options.shared.options).forEach(function(key) {
                if (cfg.imageKeys.indexOf(key) != -1) {
                    result[key] = img + options.shared.options[key]
                } else if (cfg.dataKeys.indexOf(key) != -1) {
                    result[key] = dat + options.shared.options[key]
                } else { 
                    result[key] = options.shared.options[key]
                }
            });
            return result;
        }
        var extract = function (browserOpt, exclude) {
            exclude = exclude || cfg.exclusions
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

        var mozilla = options.mozilla, webkit = options.webkit, shared = options.shared;
        Object.keys(cfg.mozilla).forEach(function(key) { mozilla[key] = cfg.mozilla[key] });
        Object.keys(cfg.webkit).forEach(function(key) { webkit[key] = cfg.webkit[key] });
        console.log(mozilla);
        console.log(webkit);
        console.log(shared);
        console.log('============================================');

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
