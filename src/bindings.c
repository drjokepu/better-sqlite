#include <stdlib.h>
#include "bindings.h"

int bind_int_sync(statement_t *stmt, int index, int value) {
	return sqlite3_bind_int(stmt->sqlite_statement, index, value);
}

int bind_int64_sync(statement_t *stmt, int index, long long value) {
	return sqlite3_bind_int64(stmt->sqlite_statement, index, value);
}

int bind_double_sync(statement_t *stmt, int index, double value) {
	return sqlite3_bind_double(stmt->sqlite_statement, index, value);
}

const char *errmsg_sync(db_t *db) {
	return sqlite3_errmsg(db->sqlite_db);
}

const char *libversion_sync(void) {
	return sqlite3_libversion();
}

//
// open
// ----

static void open_baton_do(open_baton_t *restrict baton) {
	baton->result = sqlite3_open(baton->filename, &baton->db->sqlite_db);
}

static void open_baton_free_members(open_baton_t *restrict baton) {
	if (baton->filename != NULL) {
		free(baton->filename);
	}
}

SQLITE_BINDING(open);

//
// close
// -----
	
static void close_baton_do(close_baton_t *restrict baton) {
	baton->result = sqlite3_close_v2(baton->db->sqlite_db);
}

static void close_baton_free_members(close_baton_t *restrict baton) {
}

SQLITE_BINDING(close);

//
// prepare
// -------

static void prepare_baton_do(prepare_baton_t *restrict baton) {
	baton->result = sqlite3_prepare_v2(
		baton->db->sqlite_db,
		baton->sql,
		baton->sql_length,
		&baton->statement->sqlite_statement,
		NULL
	);
}

static void prepare_baton_free_members(prepare_baton_t *restrict baton) {
	if (baton->sql != NULL) {
		free(baton->sql);
	}
}

SQLITE_BINDING(prepare);

