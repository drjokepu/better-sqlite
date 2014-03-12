var addon = require('../build/Release/sqlite');
var describeError = require('./describe_error.js');
var errorCodes = require('./error_codes.js');

function makeError(errorCode) {
	return new Error(describeError(errorCode));
}

function Db(dbWrapper) {
	this.dbWrapper = dbWrapper;
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

module.exports = {
	errorCodes: errorCodes,
	open: open
};
