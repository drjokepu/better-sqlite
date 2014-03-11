var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var sqlite = require('..');

describe('db', function() {
	it('open', function(done) {
		var filename = './db_open_test.db';

		Q
			.ninvoke(sqlite, 'open', filename)
			.then(function(db) {
				assert.notStrictEqual(db, null);
				assert.notStrictEqual(db, undefined);
			})
			.then(done)
			.fin(makeCleanup(filename))
			.done();
	});
});

function makeCleanup(filename) {
	return function cleanup() {
		fs.exists(filename, function(exists) {
			if (exists) {
				fs.unlink(filename);
			}
		});
	};
}
