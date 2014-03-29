var addon = require('../build/Release/sqlite');
var describeError = require('./describe_error.js');
var errorCodes = require('./error_codes.js');
var datatypeCodes = require('./datatype_codes.js');

function makeError(errorCode) {
	var error = Error(describeError(errorCode));
	error.code = errorCode;
	return error;
}

function LowLevelDb(dbWrapper) {
	this.dbWrapper = dbWrapper;
}

LowLevelDb.prototype.close = function(callback) {
	addon.close(this.dbWrapper, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			callback(null);
		} else {
			callback(makeError(errorCode));
		}
	});
};

LowLevelDb.prototype.errMsg = function() {
	return addon.errMsg(this.dbWrapper);
};

LowLevelDb.prototype.getAutocommit = function() {
	return addon.getAutocommit(this.dbWrapper);
};

LowLevelDb.prototype.changes = function() {
	return addon.changes(this.dbWrapper);
};

LowLevelDb.prototype.lastInsertRowId = function() {
	return addon.lastInsertRowId(this.dbWrapper);
};

LowLevelDb.prototype.prepare = function(sql, callback) {
	var statementWrapper = new addon.StatementWrapper();
	addon.prepare(this.dbWrapper, statementWrapper, sql, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			var statement = new LowLevelStatement(statementWrapper);
			callback(null, statement);
		} else {
			callback(makeError(errorCode), null);
		}
	});
};

function LowLevelStatement(statementWrapper) {
	this.statementWrapper = statementWrapper;
	this.bindParameterCursor = 1;
}

LowLevelStatement.prototype.bind = function(value, index) {
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

LowLevelStatement.prototype.bindAll = function(values) {
	if (values && Array.isArray(values)) {
		for (var i = 0; i < values.length; i++) {
			this.bind(values[i], i + 1);
		}
	}
};

LowLevelStatement.prototype.step = function(callback) {
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

LowLevelStatement.prototype.columnCount = function() {
	return addon.columnCount(this.statementWrapper);
};

LowLevelStatement.prototype.columnType = function(columnIndex) {
	return addon.columnType(this.statementWrapper, columnIndex);
};

LowLevelStatement.prototype.columnFloat = function(columnIndex) {
	return addon.columnFloat(this.statementWrapper, columnIndex);
};

LowLevelStatement.prototype.columnInteger = function(columnIndex) {
	return addon.columnInteger(this.statementWrapper, columnIndex);
};

LowLevelStatement.prototype.columnText = function(columnIndex) {
	return addon.columnText(this.statementWrapper, columnIndex);
};

LowLevelStatement.prototype.column = function(columnIndex) {
	var columnType = this.columnType(columnIndex);
	switch (columnType) {
		case datatypeCodes.SQLITE_INTEGER:
			return this.columnInteger(columnIndex);
		case datatypeCodes.SQLITE_FLOAT:
			return this.columnFloat(columnIndex);
		case datatypeCodes.SQLITE_TEXT:
			return this.columnText(columnIndex);
		case datatypeCodes.SQLITE_NULL:
			return null;
		default:
			throw new Error("Unsupported data type: " + columnType);
	}
};

LowLevelStatement.prototype.clearBindings = function() {
	this.bindParameterCursor = 1;
	return addon.clearBindings(this.statementWrapper);
};

LowLevelStatement.prototype.reset = function() {
	this.bindParameterCursor = 1;
	return addon.reset(this.statementWrapper);
};

LowLevelStatement.prototype.sql = function() {
	return addon.sql(this.statementWrapper);
};

LowLevelStatement.prototype.finalize = function() {
	var errorCode = addon.finalize(this.statementWrapper);
	if (errorCode !== errorCodes.SQLITE_OK) {
		throw makeError(errorCode);
	}
};

function open(filename, callback) {
	var dbWrapper = new addon.DbWrapper();
	addon.open(dbWrapper, filename, function(errorCode) {
		if (errorCode === errorCodes.SQLITE_OK) {
			var db = new LowLevelDb(dbWrapper);
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
