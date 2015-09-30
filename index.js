'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var os = require('os');
var path = require('path');
var URL = require('url');
var util = require('util');

var TEST_RUNNER_DIR = path.join(__dirname, 'runner');

var tnsCli = {
	'win32': 'tns.cmd'
}[require('os').platform()] || 'tns';


function NativeScriptLauncher(baseBrowserDecorator, logger, config, args, emitter, executor) {
	var self = this;

	baseBrowserDecorator(self);
	self.log = logger.create('launcher');

	if (!args.platform) {
		self.log.error('No platform specified.');
		process.exit(1);
	}

	self.platform = args.platform;

	emitter.on('file_list_modified', function() {
		self.log.info('Deploying NativeScript unit tests...');
		if (self.parsedUrl) {
			self.liveSyncAndRun(self.parsedUrl);
		}
	})

	emitter.on('browser_register', function(browser) {
		if (!browser.id || browser.id.indexOf('NativeScript') !== 0) {
			return;
		}

		self.markCaptured();

		executor.schedule();
	});

	function logDebugOutput(data) {
		if (config.logLevel === config.LOG_DEBUG) {
			process.stdout.write(data);
		}
	}

	self.liveSyncAndRun = function() {
		var runner = spawn(tnsCli, ['dev-test', self.platform, '--port', self.parsedUrl.port]);
		runner.stdout.on('data', logDebugOutput);
		runner.stderr.on('data', logDebugOutput);
		runner.on('exit', function(code) {
			self.log.info('NativeScript deployment completed with code ' + code);
			if (code) {
				process.exit(code);
			}
		});
	}

	self.start = function(url) {
		self.parsedUrl = URL.parse(url);
		self.liveSyncAndRun();
	}
}

NativeScriptLauncher.prototype = {
	name: 'NativeScript Unit Test Runner'
}

module.exports = {
  'launcher:NS': ['type', NativeScriptLauncher]
};
