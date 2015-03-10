#!/usr/bin/env node

var program = require('commander');
var pkg = require('../package.json');
var glob = require('glob');
var path = require('path');

program
	.version(pkg.version)
	.description(pkg.description)
	.usage('[options] component1 component2 ...')
	.option('-v, --versions <versions>', 'Versions of bootstrap to run tests against, specified as a semver range', '*')
	.parse(process.argv);


var components = program.args;

if (components.length === 0) {
	components = glob.sync(path.join(__dirname, '../components/*.html')).map(function(component) {
		return path.basename(component, '.html');
	});
}

require('./index')(components, program.versions);