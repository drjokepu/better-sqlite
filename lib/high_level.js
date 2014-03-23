var lowLevel = require('./low_level.js');

function Db(lowLevelDb) {
	this.lowLevelDb = lowLevelDb;
}

Db.prototype.close = function(callback) {
	this.lowLevelDb.close(callback);
};

Db.prototype.execute = function(query, params, callback) {
	if (typeof params === 'function' && typeof callback !== 'function') {
		callback = params;
		params = null;
	}

	if (typeof callback !== 'function') {
		callback = function() {};
	}

	var db = this;
	db.lowLevelDb.prepare(query, function(err, stmt) {
		if (err) {
			callback(err, null);
		} else {
			stmt.bindAll(params);
			stmt.step(function(err) {
				if (err) {
					callback(err, null);
				} else {
					callback(null, {
						changes: db.lowLevelDb.changes(),
						lastInsertRowId: db.lowLevelDb.lastInsertRowId()
					});
				}
			});
		}
	});
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
