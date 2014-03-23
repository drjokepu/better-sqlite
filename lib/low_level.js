var addon = require('../build/Release/sqlite');
var describeError = require('./describe_error.js');
var errorCodes = require('./error_codes.js');
var datatypeCodes = require('./datatype_codes.js');

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

Db.prototype.errMsg = function() {
	return addon.errMsg(this.dbWrapper);
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
	this.bindParameterCursor = 1;
}

Statement.prototype.bind = function(value, index) {
	if (index === undefined || index === null) {
		index = this.bindParameterCursor++;
	} else if (index !== parseInt(index, 10) || index < 1) {
		throw new Error('Index must be a positive integer.');
	}

	var errorCode = addon.bind(this.statementWrapper, value, index);
	if (errorCode !== errorCodes.SQLITE_OK) {
		throw makeError(errorCode);
	}
};

Statement.prototype.step = function(callback) {
	addon.step(this.statementWrapper, function(errorCode) {
		switch (errorCode) {
			case errorCodes.SQLITE_OK:
			case errorCodes.SQLITE_ROW:
			case errorCodes.SQLITE_DONE:
				callback(null, errorCode);
				break;
			default:
				callback(makeError(errorCode), null);
				break;
		}
	});
};

Statement.prototype.columnCount = function() {
	return addon.columnCount(this.statementWrapper);
};

Statement.prototype.columnType = function(columnIndex) {
	return addon.columnType(this.statementWrapper, columnIndex);
};

Statement.prototype.columnFloat = function(columnIndex) {
	return addon.columnFloat(this.statementWrapper, columnIndex);
};

Statement.prototype.columnInteger = function(columnIndex) {
	return addon.columnInteger(this.statementWrapper, columnIndex);
};

Statement.prototype.columnText = function(columnIndex) {
	return addon.columnText(this.statementWrapper, columnIndex);
};

Statement.prototype.finalize = function() {
	var errorCode = addon.finalize(this.statementWrapper);
	if (errorCode !== errorCodes.SQLITE_OK) {
		throw makeError(errorCode);
	}
};

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
	datatypeCodes: datatypeCodes,
	errorCodes: errorCodes,
	open: open,
	version: version
};
