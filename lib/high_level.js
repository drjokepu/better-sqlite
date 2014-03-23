var lowLevel = require('./low_level.js');

function Db(lowLevelDb) {
	this.lowLevelDb = lowLevelDb;
}

Db.prototype.close = function(callback) {
	this.lowLevelDb.close(callback);
};

function open(filename, callback) {
	lowLevel.open(filename, function(err, lowLevelDb) {
		if (!err) {
			callback(null, new Db(lowLevelDb));
		} else {
			callback(err, null);
		}
	});
}

module.exports = {
	lowLevel: lowLevel,
	open: open
};