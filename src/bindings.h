#ifndef __BS_BINDINGS_H__
#define __BS_BINDINGS_H__

#include <uv.h>
#include "async.h"
#include "db.h"
#include "statement.h"
#include "sqlite3/sqlite3.h"

#ifdef __cplusplus
extern "C"
{
#endif

int clear_bindings_sync(statement_t *stmt);
int bind_int_sync(statement_t *stmt, int index, int value);
int bind_int64_sync(statement_t *stmt, int index, long long value);
int bind_double_sync(statement_t *stmt, int index, double value);
int bind_text_sync(statement_t *stmt, int index, const char *value, int length);
int bind_null_sync(statement_t *stmt, int index);

int column_count_sync(statement_t *stmt);
int column_type_sync(statement_t *stmt, int column_index);
long long column_int64_sync(statement_t *stmt, int column_index);
double column_double_sync(statement_t *stmt, int column_index);
const char *column_text_sync(statement_t *stmt, int column_index);
int reset_sync(statement_t *stmt);
const char *sql_sync(statement_t *stmt);

int get_autocommit_sync(db_t *db);
int changes_sync(db_t *db);
long long last_insert_rowid_sync(db_t *db);
const char *errmsg_sync(db_t *db);
const char *libversion_sync(void);
int finalize_sync(statement_t *stmt);

typedef struct open_baton_t {
	uv_work_t req;
	db_t *db;
	char *filename;
	uv_async_t async;
	void (*c_callback)(struct open_baton_t *);
	void *js_callback;
	int result;
} open_baton_t;

ASYNC_HEADER(open)

typedef struct close_baton_t {
	uv_work_t req;
	db_t *db;
	uv_async_t async;
	void (*c_callback)(struct close_baton_t *);
	void *js_callback;
	int result;
} close_baton_t;

ASYNC_HEADER(close)
	
typedef struct prepare_baton_t {
	uv_work_t req;
	db_t *db;
	statement_t *statement;
	char *sql;
	int sql_length;
	uv_async_t async;
	void (*c_callback)(struct prepare_baton_t *);
	void *js_callback;
	int result;
} prepare_baton_t;

ASYNC_HEADER(prepare)

typedef struct step_baton_t {
	uv_work_t req;
	statement_t *statement;
	uv_async_t async;
	void (*c_callback)(struct step_baton_t *);
	void *js_callback;
	int result;
} step_baton_t;

ASYNC_HEADER(step)

#ifdef __cplusplus
}
#endif

#endif /* __BS_BINDINGS_H__ */