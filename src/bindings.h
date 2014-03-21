#ifndef __BS_BINDINGS_H__
#define __BS_BINDINGS_H__

#include <uv.h>
#include "db.h"
#include "statement.h"
#include "sqlite3/sqlite3.h"

#ifdef __cplusplus
extern "C"
{
#endif
	
#define SQLITE_BINDING(name) \
name##_baton_t *name##_baton_new(void) { \
	return calloc(1, sizeof(name##_baton_t)); \
} \
\
void name##_baton_free(name##_baton_t *baton) { \
	name##_baton_free_members(baton); \
	uv_close((uv_handle_t*)&baton->async, NULL); \
	free(baton); \
} \
\
static void name##_async_begin(void *arg) { \
	name##_baton_t *baton = (name##_baton_t*)arg; \
	name##_baton_do(baton); \
	uv_async_send(&baton->async); \
} \
\
static void name##_async_end(uv_async_t *handle, int status) { \
	name##_baton_t* baton = (name##_baton_t*)handle->data; \
	baton->c_callback(baton); \
} \
\
void name##_async(name##_baton_t *baton) { \
	uv_thread_t thread_id; \
	uv_async_init(uv_default_loop(), &baton->async, name##_async_end); \
	baton->async.data = baton; \
	uv_thread_create(&thread_id, name##_async_begin, baton); \
}

#define SQLITE_BINDING_HEADER(name) \
name##_baton_t *name##_baton_new(void); \
void name##_baton_free(name##_baton_t *baton); \
void name##_async(name##_baton_t *baton);

int bind_int_sync(statement_t *stmt, int index, int value);
int bind_int64_sync(statement_t *stmt, int index, long long value);
int bind_double_sync(statement_t *stmt, int index, double value);
int bind_text_sync(statement_t *stmt, int index, const char *value, int length);
int bind_null_sync(statement_t *stmt, int index);

int column_type_sync(statement_t *stmt, int column_index);
long long column_int64_sync(statement_t *stmt, int column_index);
double column_double_sync(statement_t *stmt, int column_index);

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

SQLITE_BINDING_HEADER(open)

typedef struct close_baton_t {
	uv_work_t req;
	db_t *db;
	uv_async_t async;
	void (*c_callback)(struct close_baton_t *);
	void *js_callback;
	int result;
} close_baton_t;

SQLITE_BINDING_HEADER(close)
	
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

SQLITE_BINDING_HEADER(prepare)

typedef struct step_baton_t {
	uv_work_t req;
	statement_t *statement;
	uv_async_t async;
	void (*c_callback)(struct step_baton_t *);
	void *js_callback;
	int result;
} step_baton_t;

SQLITE_BINDING_HEADER(step)

#ifdef __cplusplus
}
#endif

#endif /* __BS_BINDINGS_H__ */