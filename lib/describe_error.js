var errorCodes = require('./error_codes.js');

function errorCodeIdentifier(errorCode) {
	var identifiers = Object.getOwnPropertyNames(errorCodes);
	for (var i = 0; i < identifiers.length; i++) {
		var identifier = identifiers[i];
		if (errorCodes[identifier] === errorCode) {
			return identifier;
		}
	}
	return 'Unknown error';
}

module.exports = function describeError(errorCode) {
	switch (errorCode) {
		case errorCodes.SQLITE_OK:
			return 'Successful result';
		case errorCodes.SQLITE_ERROR:
			return 'SQL error or missing database';
		default:
			return errorCodeIdentifier(errorCode);
	}
};
