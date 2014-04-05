#include <stdlib.h>
#include "bindings.h"

int clear_bindings_sync(statement_t *stmt) {
	return sqlite3_clear_bindings(stmt->sqlite_statement);
}

int bind_int_sync(statement_t *stmt, int index, int value) {
	return sqlite3_bind_int(stmt->sqlite_statement, index, value);
}

int bind_int64_sync(statement_t *stmt, int index, long long value) {
	return sqlite3_bind_int64(stmt->sqlite_statement, index, value);
}

int bind_double_sync(statement_t *stmt, int index, double value) {
	return sqlite3_bind_double(stmt->sqlite_statement, index, value);
}

int bind_text_sync(statement_t *stmt, int index, const char *value, int length) {
	return sqlite3_bind_text(stmt->sqlite_statement, index, value, length, free);
}

int bind_null_sync(statement_t *stmt, int index) {
	return sqlite3_bind_null(stmt->sqlite_statement, index);
}

int column_count_sync(statement_t *stmt) {
	return sqlite3_column_count(stmt->sqlite_statement);
};

int column_type_sync(statement_t *stmt, int column_index) {
	return sqlite3_column_type(stmt->sqlite_statement, column_index);
};

long long column_int64_sync(statement_t *stmt, int column_index) {
	return sqlite3_column_int64(stmt->sqlite_statement, column_index);
}

double column_double_sync(statement_t *stmt, int column_index) {
	return sqlite3_column_double(stmt->sqlite_statement, column_index);
}

const char *column_text_sync(statement_t *stmt, int column_index) {
	return (const char *)sqlite3_column_text(stmt->sqlite_statement, column_index);
}

int reset_sync(statement_t *stmt) {
	return sqlite3_reset(stmt->sqlite_statement);
}

const char *sql_sync(statement_t *stmt) {
	return sqlite3_sql(stmt->sqlite_statement);
};

int get_autocommit_sync(db_t *db) {
	return sqlite3_get_autocommit(db->sqlite_db);
}

int changes_sync(db_t *db) {
	return sqlite3_changes(db->sqlite_db);
}

long long last_insert_rowid_sync(db_t *db) {
	return sqlite3_last_insert_rowid(db->sqlite_db);
}

const char *errmsg_sync(db_t *db) {
	return sqlite3_errmsg(db->sqlite_db);
}

const char *libversion_sync(void) {
	return sqlite3_libversion();
}
int finalize_sync(statement_t *stmt) {
	return sqlite3_finalize(stmt->sqlite_statement);
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

ASYNC(open);

//
// close
// -----
	
static void close_baton_do(close_baton_t *restrict baton) {
	baton->result = sqlite3_close_v2(baton->db->sqlite_db);
}

static void close_baton_free_members(close_baton_t *restrict baton) {
}

ASYNC(close);

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

ASYNC(prepare);

//
// step
// ----

static void step_baton_do(step_baton_t *restrict baton) {
	baton->result = sqlite3_step(baton->statement->sqlite_statement);
}

static void step_baton_free_members(step_baton_t *restrict baton) {
}

ASYNC(step);

