var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var sqlite = require('..').lowLevel;

Q.longStackSupport = true;

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
					assert.strictEqual(db.constructor.name, 'LowLevelDb');
					return Q.ninvoke(db, 'close');
				})
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});

		it('get autocommit', function() {
			var scope = {
				filename: './db_get_autocommit_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					assert.strictEqual(scope.db.getAutocommit(), true);
					return scope.db;
				})
				.then(makeExecuteStatement('begin'))
				.then(function() {
					assert.strictEqual(scope.db.getAutocommit(), false);
					return scope.db;
				})
				.then(makeExecuteStatement('commit'))
				.then(function(stmt) {
					assert.strictEqual(scope.db.getAutocommit(), true);
				})
				.fin(makeCloseStatementAndDb(scope))
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});

		it('last insert row id', function() {
			var scope = {
				filename: './db_last_insert_rowid_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					return makeTable('integer')(scope.db);
				})
				.then(function() {
					return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (14000, 33333)');
				})
				.then(function(stmt) {
					scope.stmt = stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					scope.stmt.finalize();
					delete scope.stmt;
					assert.strictEqual(scope.db.lastInsertRowId(), 14000);
				})
				.fin(makeCloseStatementAndDb(scope))
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});

		it('changes', function() {
			var scope = {
				filename: './db_changes_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					return makeTable('integer')(scope.db);
				})
				.then(function() {
					return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (?, ?)');
				})
				.then(function(stmt) {
					scope.insertStmt = stmt;
					scope.insertStmt.bind(1);
					scope.insertStmt.bind(4000);
					return Q.ninvoke(scope.insertStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					assert.strictEqual(scope.db.changes(), 1);
					scope.insertStmt.reset();
					scope.insertStmt.bind(2);
					scope.insertStmt.bind(5000);
					return Q.ninvoke(scope.insertStmt, 'step');
				})
				.then(function(code) {
					scope.insertStmt.finalize();
					delete scope.insertStmt;
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					assert.strictEqual(scope.db.changes(), 1);
					return Q.ninvoke(scope.db, 'prepare', 'update test_table_0 set col_1 = 9999');
				})
				.then(function(stmt) {
					scope.updateStmt = stmt;
					return Q.ninvoke(scope.updateStmt, 'step');
				})
				.then(function(code) {
					scope.updateStmt.finalize();
					delete scope.updateStmt;
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					assert.strictEqual(scope.db.changes(), 2);
				})
				.fin(makeCloseStatementAndDb(scope))
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
						assert.strictEqual(stmt.constructor.name, 'LowLevelStatement');
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
						return Q.ninvoke(db, 'prepare', 'select no_test_column_0 from no_test_table_1;');
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
						filename: './stmt_bind_' + code + ' _test.db'
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

			it('all', function() {
				var scope = {
					filename: './stmt_clear_bind_all_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('integer')(scope.db);
					})
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (?, ?)');
					})
					.then(function(stmt) {
						scope.insertStmt = stmt;
						scope.insertStmt.bindAll([100, 1414]);
						return Q.ninvoke(scope.insertStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
						scope.insertStmt.finalize();
						delete scope.insertStmt;
						return Q.ninvoke(scope.db, 'prepare', 'select id, col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.selectStmt = stmt;
						return Q.ninvoke(scope.selectStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
						assert.strictEqual(scope.selectStmt.columnInteger(0), 100);
						assert.strictEqual(scope.selectStmt.columnType(1), sqlite.datatypeCodes.SQLITE_INTEGER);
						assert.strictEqual(scope.selectStmt.columnInteger(1), 1414);
					})
					.fin(function() {
						if (scope.selectStmt) {
							scope.selectStmt.finalize();
							delete scope.selectStmt;
						}
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

			it('clear', function() {
				var scope = {
					filename: './stmt_clear_bindings_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('integer')(scope.db);
					})
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (?, ?)');
					})
					.then(function(stmt) {
						scope.insertStmt = stmt;
						scope.insertStmt.bind(1);
						scope.insertStmt.bind(1200);
						return Q.ninvoke(scope.insertStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
						scope.insertStmt.reset();
						scope.insertStmt.clearBindings();
						scope.insertStmt.bind(2);
						return Q.ninvoke(scope.insertStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
						scope.insertStmt.finalize();
						return Q.ninvoke(scope.db, 'prepare', 'select id, col_1 from test_table_0 order by id');
					})
					.then(function(stmt) {
						scope.selectStmt = stmt;
						return Q.ninvoke(scope.selectStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
						assert.strictEqual(scope.selectStmt.columnInteger(0), 1);
						assert.strictEqual(scope.selectStmt.columnType(1), sqlite.datatypeCodes.SQLITE_INTEGER);
						assert.strictEqual(scope.selectStmt.columnInteger(1), 1200);
						return Q.ninvoke(scope.selectStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
						assert.strictEqual(scope.selectStmt.columnInteger(0), 2);
						assert.strictEqual(scope.selectStmt.columnType(1), sqlite.datatypeCodes.SQLITE_NULL);
						return Q.ninvoke(scope.selectStmt, 'step');
					})
					.then(function(code) {
						assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
						scope.selectStmt.finalize();
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});
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
						return makeTable('integer')(scope.db);
					})
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (1, 9000)');
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
			it('count', function() {
				var scope = {
					filename: './stmt_column_count_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('text')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'hello\')'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select id, col_1, 10, 20, 30, 40, 50, 60, 70, 80 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var datatypeCode = scope.stmt.columnCount();
						assert.strictEqual(datatypeCode, 10);
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});

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

			it('text', function() {
				var scope = {
					filename: './stmt_column_text_test.db'
				};

				return Q
					.ninvoke(sqlite, 'open', scope.filename)
					.then(function(db) {
						scope.db = db;
						return makeTable('real')(scope.db);
					})
					.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'Hello, World!\')'))
					.then(function() {
						return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
					})
					.then(function(stmt) {
						scope.stmt = stmt;
						return Q.ninvoke(stmt, 'step');
					})
					.then(function() {
						var value = scope.stmt.columnText(0);
						assert.strictEqual(value, 'Hello, World!');
					})
					.fin(makeCloseStatementAndDb(scope))
					.fin(makeCleanup(scope))
					.fail(makeReportError(scope));
			});
			
			describe('auto', function() {
				it('int32', function() {
					var scope = {
						filename: './stmt_column_auto_int32_test.db'
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
							var value = scope.stmt.column(0);
							assert.strictEqual(value, 96000);
						})
						.fin(makeCloseStatementAndDb(scope))
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				});

				it('int64', function() {
					var scope = {
						filename: './stmt_column_auto_int64_test.db'
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
							var value = scope.stmt.column(0);
							assert.strictEqual(value, 17188322307);
						})
						.fin(makeCloseStatementAndDb(scope))
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				});

				it('float', function() {
					var scope = {
						filename: './stmt_column_auto_float_test.db'
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
							var value = scope.stmt.column(0);
							assert.strictEqual(value, 340.5);
						})
						.fin(makeCloseStatementAndDb(scope))
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				});

				it('text', function() {
					var scope = {
						filename: './stmt_column_auto_text_test.db'
					};

					return Q
						.ninvoke(sqlite, 'open', scope.filename)
						.then(function(db) {
							scope.db = db;
							return makeTable('real')(scope.db);
						})
						.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'Hello, World!\')'))
						.then(function() {
							return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
						})
						.then(function(stmt) {
							scope.stmt = stmt;
							return Q.ninvoke(stmt, 'step');
						})
						.then(function() {
							var value = scope.stmt.column(0);
							assert.strictEqual(value, 'Hello, World!');
						})
						.fin(makeCloseStatementAndDb(scope))
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				});
			
				it('null', function() {
					var scope = {
						filename: './stmt_column_auto_null_test.db'
					};

					return Q
						.ninvoke(sqlite, 'open', scope.filename)
						.then(function(db) {
							scope.db = db;
							return makeTable('integer')(scope.db);
						})
						.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, null)'))
						.then(function() {
							return Q.ninvoke(scope.db, 'prepare', 'select col_1 from test_table_0');
						})
						.then(function(stmt) {
							scope.stmt = stmt;
							return Q.ninvoke(stmt, 'step');
						})
						.then(function() {
							var value = scope.stmt.column(0);
							assert.strictEqual(value, null);
						})
						.fin(makeCloseStatementAndDb(scope))
						.fin(makeCleanup(scope))
						.fail(makeReportError(scope));
				});
			});
		});

		it('sql', function() {
			var scope = {
				filename: './stmt_sql_test.db',
				sql: 'select id, col_1 from test_table_0'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					return makeTable('text')(scope.db);
				})
				.then(makeExecuteStatement('insert into test_table_0 (id, col_1) values (100, \'hello\')'))
				.then(function() {
					return Q.ninvoke(scope.db, 'prepare', scope.sql);
				})
				.then(function(stmt) {
					scope.stmt = stmt;
					return Q.ninvoke(stmt, 'step');
				})
				.then(function() {
					var sql = scope.stmt.sql();
					assert.strictEqual(sql, scope.sql);
				})
				.fin(makeCloseStatementAndDb(scope))
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});

		it('reset', function() {
			var scope = {
				filename: './stmt_reset_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					return makeTable('integer')(scope.db);
				})
				.then(function() {
					return Q.ninvoke(scope.db, 'prepare', 'insert into test_table_0 (id, col_1) values (?, ?)');
				})
				.then(function(stmt) {
					scope.insertStmt = stmt;
					scope.insertStmt.bind(1);
					scope.insertStmt.bind(1200);
					return Q.ninvoke(scope.insertStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					scope.insertStmt.reset();
					scope.insertStmt.bind(2);
					scope.insertStmt.bind(3000);
					return Q.ninvoke(scope.insertStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					scope.insertStmt.reset();
					scope.insertStmt.bind(3);
					return Q.ninvoke(scope.insertStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					scope.insertStmt.finalize();
					return Q.ninvoke(scope.db, 'prepare', 'select id, col_1 from test_table_0 order by id');
				})
				.then(function(stmt) {
					scope.selectStmt = stmt;
					return Q.ninvoke(scope.selectStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
					assert.strictEqual(scope.selectStmt.columnInteger(0), 1);
					assert.strictEqual(scope.selectStmt.columnInteger(1), 1200);
					return Q.ninvoke(scope.selectStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
					assert.strictEqual(scope.selectStmt.columnInteger(0), 2);
					assert.strictEqual(scope.selectStmt.columnInteger(1), 3000);
					return Q.ninvoke(scope.selectStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_ROW);
					assert.strictEqual(scope.selectStmt.columnInteger(0), 3);
					assert.strictEqual(scope.selectStmt.columnInteger(1), 3000);
					return Q.ninvoke(scope.selectStmt, 'step');
				})
				.then(function(code) {
					assert.strictEqual(code, sqlite.errorCodes.SQLITE_DONE);
					scope.selectStmt.finalize();
				})
				.fin(makeCloseStatementAndDb(scope))
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
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
	return makeExecuteStatement('create table test_table_0 (id integer primary key not null, col_1 ' + type + ');');
}

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
