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
				assert.strictEqual(db.constructor.name, 'Db');
			})
			.then(done)
			.fin(makeCleanup(filename))
			.done();
	});

	it('close', function(done) {
		var filename = './db_close_test.db',
			db = null;
		Q
			.ninvoke(sqlite, 'open', filename)
			.then(function(_db) {
				db = _db;
				assert.notStrictEqual(db, null);
				assert.notStrictEqual(db, undefined);
				assert.strictEqual(db.constructor.name, 'Db');
				return Q.ninvoke(db, 'close');
			})
			.then(done)
			.fin(makeCleanup(filename))
			.done();
	});

	it('version', function() {
		var version = sqlite.version();
		assert.strictEqual(version, '3.8.4.1');
	});
});

describe('statement', function() {
	describe('prepare', function() {
		it('success', function(done) {
			var filename = './stmt_prepare_test.db',
				stmt = null;
			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'select 100;');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					assert.notStrictEqual(stmt, null);
					assert.notStrictEqual(stmt, undefined);
					assert.strictEqual(stmt.constructor.name, 'Statement');
					return Q.ninvoke(db, 'close');
				})
				.then(done)
				.fin(makeCleanup(filename))
				.done();
		});
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
