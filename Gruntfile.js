module.exports = function(grunt) {
  var semver = require('semver');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: ['dist'],
    connect: {
      all: {
        options: {
          hostname: '*',
          port: 9000,
          base: ['./lib', './dist']
        }
      }
    },
    watch: {
      all: {
        files: [],
        tasks: []
      }
    },
    generate_files: {
      options: {
        versions: grunt.file.expand({
          filter: 'isDirectory',
          cwd: 'lib'
        }, ['v*']),
        components: grunt.file.expand({
          filter: 'isFile',
        }, 'components/*.html'),
        tmpl: 'main.jade'
      }
    },

    run_perf_tests: {
      options: {
        couch: {
          server: 'https://axemclion.cloudant.com/',
          database: 'bootstrap-performance',
          updateSite: false
        },
        selenium: {
          hostname: "localhost",
          port: 4444
        },
        browser: ['chrome', 'firefox'],
        suite: "Bootstrap :: Rendering performance on the browser",
        log: {
          'fatal': grunt.fail.fatal.bind(grunt.fail),
          'error': grunt.fail.warn.bind(grunt.fail),
          'warn': grunt.log.error.bind(grunt.log),
          'info': grunt.log.ok.bind(grunt.log),
          'debug': grunt.verbose.writeln.bind(grunt.verbose),
          'trace': grunt.log.debug.bind(grunt.log)
        }
      }
    }
  });

  // Loading dependencies
  require('load-grunt-tasks')(grunt);
  var task = grunt.config.data.run_perf_tests,
    path = require('path');
  grunt.util._.each(grunt.file.expand({
    filter: 'isFile'
  }, './dist/**/*.html'), function(file) {
    file = path.relative('./dist', file);
    var version = path.dirname(file),
      component = path.basename(file);
    task[version + '_' + component] = {
      options: {
        url: 'http://localhost:9000/' + version + '/' + component,
        name: component.replace(/.html/, ''),
        run: version
      }
    }
  });

  grunt.registerTask('generate_files', 'Generate HTML files for telemetry', function() {
    var opts = this.options(),
      jade = require('jade'),
      tmpl = jade.compile(grunt.file.read(opts.tmpl));

    for (var j = 0; j < opts.components.length; j++) {
      var componentHTML = grunt.file.read(opts.components[j]),
        componentName = opts.components[j].replace(/^components\//, '').replace(/.html/, '');
      grunt.log.writeln('Writing HTML files for ' + componentName);
      for (var i = 0; i < opts.versions.length; i++) {
        var v = opts.versions[i].substring(1),
          cssFile, javascript = null;

        if (semver.satisfies(v, '1.0.0 - 1.2.0')) {
          cssFile = '/v' + v + '/bootstrap-' + v + '.css';
        } else if (semver.satisfies(v, '1.3.0 - 1.4.0')) {
          cssFile = '/v' + v + '/bootstrap.css';
        } else if (semver.satisfies(v, '2.0.0 - 2.3.2')) {
          cssFile = '/v' + v + '/css/bootstrap.css';
          javascript = '/v' + v + '/js/bootstrap.js';
        } else if (semver.gte(v, '3.0.0')) {
          cssFile = '/v' + v + '/css/bootstrap.css';
          javascript = '/v' + v + '/js/bootstrap.js';
        }

        grunt.file.write('dist/v' + v + '/' + componentName + '.html', tmpl({
          css: cssFile,
          javascript: javascript,
          version: opts.versions[i],
          component: componentName,
          componentHTML: componentHTML
        }));
      }
    }
  });

  var perfJankie = require('perfJankie');
  grunt.registerMultiTask('run_perf_tests', 'Runs Performance tests', function() {
    var done = this.async();
    var options = this.options();
    options.callback = function(err, res) {
      grunt.log.writeln('Completed testing for ', options.name, options.run)
      done(!err);
    }
    perfJankie(options);
  });

  grunt.registerTask('default', ['clean', 'connect', 'generate_files', 'run_perf_tests']);
};