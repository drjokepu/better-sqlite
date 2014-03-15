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
				db = null,
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

		it('error', function(done) {
			var filename = './stmt_prepare_error_0_test.db',
				db = null,
				stmt = null;
			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'select no_test_colimn_0 from no_test_table_1;');
				})
				.then(function(_stmt) {
					assert.fail('no error raised');
				}, function(err) {
					assert.strictEqual(db.errMsg(), 'no such table: no_test_table_1');
					return Q.ninvoke(db, 'close');
				})
				.then(done)
				.fin(makeCleanup(filename))
				.done();
		});
	});

	describe('bind', function() {
		it('int32', function(done) {
			var filename = './stmt_prepare_bind_int32_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'select ?');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					stmt.bind(512);
					return Q.ninvoke(db, 'close');
				})
				.then(done)
				.fin(makeCleanup(filename))
				.done();
		});

		it('int64', function(done) {
			var filename = './stmt_prepare_bind_int64_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'select ?');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					stmt.bind(68719476736);
					return Q.ninvoke(db, 'close');
				})
				.then(done)
				.fin(makeCleanup(filename))
				.done();
		});

		it('double', function(done) {
			var filename = './stmt_prepare_bind_double_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'select ?');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					stmt.bind(-140.25);
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
