module.exports = function(grunt) {
  var semver = require('semver');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    CHROMIUM_SRC: process.env.CHROMIUM_SRC || 'C:\\_workspace\\work\\chromium.r197479\\home\\src_tarball\\tarball\\chromium\\src\\',
    clean: ['dist'],
    telemetry_files: {
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
    copy: {
      page_sets: {
        files: [{
          expand: true,
          cwd: 'dist',
          src: ['**'],
          dest: '<%= CHROMIUM_SRC %>/tools/perf/page_sets'
        }]
      },
      lib: {
        files: [{
          expand: true,
          cwd: 'lib',
          src: ['**'],
          dest: '<%= CHROMIUM_SRC %>/tools/perf/page_sets/bootstrap'
        }]
      }
    }
  });


  // Loading dependencies
  for (var key in grunt.file.readJSON('package.json').devDependencies) {
    if (key !== 'grunt' && key.indexOf('grunt') === 0) {
      grunt.loadNpmTasks(key);
    }
  }

  grunt.registerTask('telemetry_files', 'Generate HTML files for telemetry', function() {
    var opts = this.options(),
      jade = require('jade'),
      tmpl = jade.compile(grunt.file.read(opts.tmpl)),
      telemetryEntry_blank = {
        url: 'file:///bootstrap/blank.html',
        smoothness: {
          action: 'scroll'
        }
      },
      pageSets = [telemetryEntry_blank],
      pageSet_component = [telemetryEntry_blank];

    for (var j = 0; j < opts.components.length; j++) {
      var componentHTML = grunt.file.read(opts.components[j]),
        componentName = opts.components[j].replace(/^components\//, '').replace(/.html/, '');
      grunt.log.writeln('Writing HTML files for ' + componentName);
      for (var i = 0; i < opts.versions.length; i++) {
        var v = opts.versions[i].substring(1),
          cssFile, javascript = null;

        if (semver.satisfies(v, '1.0.0 - 1.2.0')) {
          cssFile = 'bootstrap-' + v + '.css';
        } else if (semver.satisfies(v, '1.3.0 - 1.4.0')) {
          cssFile = 'bootstrap.css';
        } else if (semver.satisfies(v, '2.0.0 - 2.3.2')) {
          cssFile = 'css/bootstrap.css';
          javascript = 'js/bootstrap.js';
        } else if (semver.gte(v, '3.0.0')) {
          cssFile = 'css/bootstrap.css';
          javascript = 'js/bootstrap.js';
        }


        var telemetryEntry = {
          url: 'file:///bootstrap/v' + v + '/' + componentName + '.html',
          smoothness: {
            action: 'scroll'
          }
        };

        pageSets.push(telemetryEntry);
        pageSet_component.push(telemetryEntry)
        grunt.file.write('dist/bootstrap/v' + v + '/' + componentName + '.html', tmpl({
          css: cssFile,
          javascript: javascript,
          version: opts.versions[i],
          component: componentName,
          componentHTML: componentHTML
        }));
      }
      grunt.file.write('dist/bootstrap-perf-' + componentName + '.json', JSON.stringify({
        description: 'Twitter Bootstrap performace tests over versions for ' + componentName,
        pages: pageSet_component
      }));
      pageSet_component = [telemetryEntry_blank];
    }

    grunt.file.write('dist/bootstrap-perf.json', JSON.stringify({
      description: 'Twitter Bootstrap performace tests over versions',
      pages: pageSets
    }));

  });

  grunt.registerTask('default', ['clean', 'telemetry_files', 'copy']);
};