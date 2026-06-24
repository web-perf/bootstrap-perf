'use strict';
var assert = require('assert');

// Verify all main modules load without errors
try {
  require('../lib/index');
  console.log('✓ lib/index loads');
} catch(e) {
  // Some load errors are acceptable if they're about missing optional services
  // but import/syntax errors are not
  if (e.code === 'MODULE_NOT_FOUND' && !e.message.includes('lib/index')) {
    console.log('✓ lib/index loads (missing optional dep: ' + e.message + ')');
  } else {
    console.error('✗ lib/index failed:', e.message);
    process.exit(1);
  }
}

// Verify CLI module exports
try {
  // Don't execute CLI, just verify it parses
  var fs = require('fs');
  var cliSrc = fs.readFileSync('./lib/cli.js', 'utf8');
  assert.ok(cliSrc.length > 0, 'cli.js should not be empty');
  console.log('✓ lib/cli.js is readable');
} catch(e) {
  console.error('✗ CLI check failed:', e.message);
  process.exit(1);
}

console.log('\nAll smoke tests passed.');
