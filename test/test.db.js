var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var sqlite = require('..').lowLevel;

describe('low level', function() {
	describe('db', function() {
		it('open & close', function() {
			var scope = {
				filename: './db_open_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					assert.notStrictEqual(db, null);
					assert.notStrictEqual(db, undefined);
					assert.strictEqual(db.constructor.name, 'Db');
					return Q.ninvoke(db, 'close');
				})
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});

		it('version', function() {
			var version = sqlite.version();
			assert.strictEqual(version, '3.8.4.1');
		});
	});

	describe('statement', function() {
		describe('prepare', function() {
			it('success', function() {
				var scope = {
					filename: './stmt_prepare_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return Q.ninvoke(db, 'prepare', 'select 100;');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						assert.notStrictEqual(stmt, null);
						assert.notStrictEqual(stmt, undefined);
						assert.strictEqual(stmt.constructor.name, 'Statement');
						stmt.finalize();
						return Q.ninvoke(scope.db, 'close');
					})
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

			it('error', function() {
				var scope = {
					filename: './stmt_prepare_error_0_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return Q.ninvoke(db, 'prepare', 'select no_test_colimn_0 from no_test_table_1;');
					})
					.then(function(stmt) {
						assert.fail('no error raised');
						stmt.finalize();
					}, function(err) {
						assert.strictEqual(scope.db.errMsg(), 'no such table: no_test_table_1');
						return Q.ninvoke(scope.db, 'close');
					})
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});
		});

		describe('bind', function() {
			function makeBindTest(value) {
				return function() {
					var code = Math.floor(Math.random() * 10000000);
					var scope = {
						filename: './stmt_prepare_bind_' + code + ' _test.db'
					};

					return Q
						.ninvoke(sqlite, 'open', scope.filename)
						.then(function(db) {
							scope.db = db;
							return Q.ninvoke(db, 'prepare', 'select ?');
						})
						.then(function(stmt) {
							stmt.bind(value);
							stmt.finalize();
							return Q.ninvoke(scope.db, 'close');
						})
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				};
			}

			it('int32', makeBindTest(512));
			it('int64', makeBindTest(68719476736));
			it('double', makeBindTest(-140.25));
			it('text', makeBindTest('let it be'));
			it('null', makeBindTest(null));
		});

		describe('step', function() {
			it('create table', function() {
				var scope = {
					filename: './stmt_step_create_table_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return Q.ninvoke(db, 'prepare', 'create table test_table_0 (id integer not null, name text not null);');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						scope.stmt.finalize();
						return Q.ninvoke(scope.db, 'close');
					})
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});
		});

		describe('column', function() {
			function makeCloseStatementAndDb(scope) {
				return function closeStatementAndDb() {
					if (scope.stmt) {
						scope.stmt.finalize();
					}
					if (scope.db) {
						return Q.ninvoke(scope.db, 'close');
					}
				};
			}

			it('type', function() {
				var scope = {
					filename: './stmt_column_type_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('text')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'hello\')'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var datatypeCode = scope.stmt.columnType(0);
						assert.strictEqual(datatypeCode, sqlite.datatypeCodes.SQLITE_TEXT);
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

			it('int32', function() {
				var scope = {
					filename: './stmt_column_int32_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('integer')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, 96000)'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var value = scope.stmt.columnInteger(0);
						assert.strictEqual(value, 96000);
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

			it('int64', function() {
				var scope = {
					filename: './stmt_column_int64_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('integer')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, 17188322307)'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var value = scope.stmt.columnInteger(0);
						assert.strictEqual(value, 17188322307);
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

			it('float', function() {
				var scope = {
					filename: './stmt_column_float_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('real')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, 340.5)'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var value = scope.stmt.columnFloat(0);
						assert.strictEqual(value, 340.5);
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});
		});
	});
});

function makeExecuteStatement(sql) {
	return function executeStatement(db) {
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

function makeCleanup(scope) {
	return function cleanup() {
		fs.exists(scope.filename, function(exists) {
			if (exists) {
				fs.unlink(scope.filename);
			}
		});
	};
}

function makeReportError(scope) {
	return function reportError(err) {
		if (scope.db) {
			console.error('SQLite Error: ' + scope.db.errMsg());
		}

		throw err;
	};
}
