var assert = require('assert');
var fs = require('fs');
var Q = require('q');
var sqlite = require('..');

Q.longStackSupport = true;

describe('high level', function() {
	describe('db', function() {
		it('open & close', function() {
			var scope = {
				filename: './hl_open_test.db'
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
		
		it('execute', function() {
			var scope = {
				filename: './hl_execute_test.db'
			};

			return Q
				.ninvoke(sqlite, 'open', scope.filename)
				.then(function(db) {
					scope.db = db;
					return Q.ninvoke(db, 'execute', 'create table my_test_table(id integer primary key not null)');
				})
				.fin(makeCleanup(scope))
				.fail(makeReportError(scope));
		});
	});
});

function makeCloseDb(scope) {
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
			console.error('SQLite Error: ' + scope.db.lowLevelDb.errMsg());
		}

		throw err;
	};
}
