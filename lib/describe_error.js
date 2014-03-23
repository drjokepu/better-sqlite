var errorCodes = require('./error_codes.js');

function errorCodeIdentifier(errorCode) {
	var identifiers = Object.getOwnPropertyNames(errorCodes);
	for (var i = 0; i < identifiers.length; i++) {
		var identifier = identifiers[i];
		if (errorCodes[identifier] === errorCode) {
			return identifier;
		}
	}
	return 'UNKNOWN';
}

function errorCodeDescription(errorCode) {
	switch (errorCode) {
		case errorCodes.SQLITE_OK:
			return 'Successful result';
		case errorCodes.SQLITE_ERROR:
			return 'SQL error or missing database';
		case errorCodes.SQLITE_RANGE:
			return '2nd parameter to sqlite3_bind out of range';
		case errorCodes.SQLITE_NOTADB:
			return 'File opened that is not a database file';
		case errorCodes.SQLITE_ROW:
			return 'sqlite3_step() has another row ready';
		case errorCodes.SQLITE_DONE:
			return 'sqlite3_step() has finished executing';
		default:
			return null;
	}
}

module.exports = function describeError(errorCode) {
	var description = errorCodeDescription(errorCode);
	if (description === null) {
		return errorCodeIdentifier(errorCode) + ' (' + errorCode + ')';
	} else {
		return errorCodeIdentifier(errorCode) + ' (' + errorCode + '): ' + description;
	}
};
