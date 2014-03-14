var addon = require('../build/Release/sqlite');
var describeError = require('./describe_error.js');
var errorCodes = require('./error_codes.js');

function makeError(errorCode) {
	var error = Error(describeError(errorCode));
	error.code = errorCode;
	return error;
}

function Db(dbWrapper) {
	this.dbWrapper = dbWrapper;
}

Db.prototype.close = function(callback) {
	addon.close(this.dbWrapper, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			callback(null);
		} else {
			callback(makeError(errorCode));
		}
	});
};

Db.prototype.prepare = function(sql, callback) {
	var statementWrapper = new addon.StatementWrapper();
	addon.prepare(this.dbWrapper, statementWrapper, sql, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			var statement = new Statement(statementWrapper);
			callback(null, statement);
		} else {
			callback(makeError(errorCode), null);
		}
	});
};

function Statement(statementWrapper) {
	this.statementWrapper = statementWrapper;
}

function open(filename, callback) {
	var dbWrapper = new addon.DbWrapper();
	addon.open(dbWrapper, filename, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			var db = new Db(dbWrapper);
			callback(null, db);
		} else {
			callback(makeError(errorCode), null);
		}
	});
}

function version() {
	return addon.version();
}

module.exports = {
	errorCodes: errorCodes,
	open: open,
	version: version
};
