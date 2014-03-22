var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var sqlite = require('..').lowLevel;

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
					stmt.finalize();
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
					stmt.finalize();
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
		function makeBindTest(value) {
			return function(done) {
				var code = Math.floor(Math.random() * 10000000);
				var filename = './stmt_prepare_bind_' + code + ' _test.db',
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
						stmt.bind(value);
						stmt.finalize();
						return Q.ninvoke(db, 'close');
					})
					.then(done)
					.fin(makeCleanup(filename))
					.done();
			};
		}

		it('int32', makeBindTest(512));
		it('int64', makeBindTest(68719476736));
		it('double', makeBindTest(-140.25));
		it('text', makeBindTest('let it be'));
		it('null', makeBindTest(null));
	});

	describe('step', function() {
		it('create table', function(done) {
			var filename = './stmt_step_create_table_test.db',
				db = null,
				stmt = null;
			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return Q.ninvoke(db, 'prepare', 'create table test_table_0 (id integer not null, name text not null);');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					stmt.finalize();
					return Q.ninvoke(db, 'close');
				})
				.then(done)
				.fin(makeCleanup(filename))
				.done();
		});
	});

	describe('column', function() {
		it('type', function(done) {
			var filename = './stmt_column_type_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return makeTable('text')(db);
				})
				.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'hello\')'))
				.then(function() {
					return Q.ninvoke(db, 'prepare', 'select col_1 from test_table_0');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					var datatypeCode = stmt.columnType(0);
					assert.strictEqual(datatypeCode, sqlite.datatypeCodes.SQLITE_TEXT);
				})
				.then(done)
				.fin(function() {
					if (stmt !== null) {
						stmt.finalize();
					}
					if (db !== null) {
						return Q.ninvoke(db, 'close');
					}
				})
				.
			finally(makeCleanup(filename))
				.done();
		});

		it('int32', function(done) {
			var filename = './stmt_column_int32_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return makeTable('integer')(db);
				})
				.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, 96000)'))
				.then(function() {
					return Q.ninvoke(db, 'prepare', 'select col_1 from test_table_0');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					var value = stmt.columnInteger(0);
					assert.strictEqual(value, 96000);
				})
				.then(done)
				.fin(function() {
					if (stmt !== null) {
						stmt.finalize();
					}
					if (db !== null) {
						return Q.ninvoke(db, 'close');
					}
				})
				.fin(makeCleanup(filename))
				.done();
		});

		it('int64', function(done) {
			var filename = './stmt_column_int64_test.db',
				db = null,
				stmt = null;

			Q
				.ninvoke(sqlite, 'open', filename)
				.then(function(_db) {
					db = _db;
					return makeTable('integer')(db);
				})
				.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, 17188322307)'))
				.then(function() {
					return Q.ninvoke(db, 'prepare', 'select col_1 from test_table_0');
				})
				.then(function(_stmt) {
					stmt = _stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					var value = stmt.columnInteger(0);
					assert.strictEqual(value, 17188322307);
				})
				.then(done)
				.fin(function() {
					if (stmt !== null) {
						stmt.finalize();
					}
					if (db !== null) {
						return Q.ninvoke(db, 'close');
					}
				})
				.fin(makeCleanup(filename))
				.done();
		});
	});
});

function makeExecuteStatement(sql) {
	return function(db) {
		var stmt;
		return Q
			.ninvoke(db, 'prepare', sql)
			.then(function(_stmt) {
				stmt = _stmt;
				return Q.ninvoke(stmt, 'step');
			})
			.then(function() {
				stmt.finalize();
				return db;
			});
	};
}

function makeTable(type) {
	return makeExecuteStatement('create table test_table_0 (id integer not null, col_1 ' + type + ');');
}

function makeCleanup(filename) {
	return function cleanup() {
		fs.exists(filename, function(exists) {
			if (exists) {
				fs.unlink(filename);
			}
		});
	};
}
