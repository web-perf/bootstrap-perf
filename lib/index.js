var fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	rimraf = require('rimraf'),
	static = require('node-static'),
	semver = require('semver'),
	perfjankie = require('perfjankie');

var bootstrapLibs = require('./bootstrap-versions.json');

var COUCH = {
	server: 'http://admin_user:admin_pass@localhost:5984',
	database: 'bootstrap-perf'
};

function getMatchingVersions(semVersions) {
	return _.filter(_.keys(bootstrapLibs), function(version) {
		return semver.satisfies(version, semVersions);
	});
}

function generateFiles(components, versions) {
	var template = _.template(fs.readFileSync(path.join(__dirname, 'template.html')));

	rimraf.sync('./bin');
	fs.mkdirSync(path.join(__dirname, '../bin'))

	_.forEach(versions, function(version) {
		var dir = path.join(__dirname, '../bin/', 'v' + version);
		fs.mkdirSync(dir);
		_.forEach(components, function(component) {
			var file = path.join(dir, component + '.html');
			fs.writeFileSync(file, template({
				repeat: 200,
				version: version,
				component: component,
				componentHTML: fs.readFileSync(path.join(__dirname, '../components', component + '.html')),
				css: bootstrapLibs[version].css,
				javascript: bootstrapLibs[version].js
			}));
		});
	});
}


function runPerfTests(components, versions, cb) {
	var queue = [];

	_.forEach(components, function(component) {
		_.forEach(versions, function(version) {
			queue.push({
				component: component,
				version: version,
				url: ['http://localhost:8080/v', version, '/', component, '.html'].join('')
			});
		});
	});

	(function runQueue(i) {
		if (i < queue.length) {
			var job = queue[i];
			console.log('Running [%d/%d] %s@%s ', i, queue.length, job.component, job.version);
			perfjankie({
				suite: 'Bootstrap - Performance analysis',
				url: job.url,
				name: job.component,
				run: job.version,
				time: semver.major(job.version) * 10000 + semver.minor(job.version) * 1000 + semver.patch(job.version),
				callback: function(err, res) {
					if (err) {
						console.error(err);
					}
					runQueue(i + 1);
				},
				repeat: 10,
				selenium: 'http://localhost:9515',
				couch: COUCH,
				browsers: ['chrome']
			});
		} else {
			cb();
		}
	}(0));
}

function main(components, semVersions) {
	var versions = getMatchingVersions(semVersions);

	generateFiles(components, versions);

	var server = require('http').createServer(function(request, response) {
		request.addListener('end', function() {
			new static.Server(path.join(__dirname, '../bin')).serve(request, response);
		}).resume();
	}).listen(8080);

	perfjankie({
		couch: _.assign({
			updateSite: true,
			onlyUpdateSite: true
		}, COUCH),
		callback: function() {
			runPerfTests(components, versions, function() {
				console.log('All done, view results at %s/%s/_design/site/index.html', COUCH.server, COUCH.database);
				server.close();
			});
		}
	});
};


module.exports = main;