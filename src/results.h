#ifndef __BS_RESULTS_H__
#define __BS_RESULTS_H__

#include <stddef.h>
#include <uv.h>
#include "async.h"
#include "sqlite3/sqlite3.h"
#include "statement.h"

#ifdef __cplusplus
extern "C"
{
#endif
	
typedef enum record_type_t {
	record_type_integer = SQLITE_INTEGER,
	record_type_float = SQLITE_FLOAT,
	record_type_blob = SQLITE_BLOB,
	record_type_null = SQLITE_NULL,
	record_type_text = SQLITE_TEXT
} record_type_t;
	
typedef struct record_t {
	record_type_t type;
	union {
		long long integer_value;
		double float_value;
		struct {
			size_t length;
			char *text;
		} text_value;
		struct {
			size_t length;
			void *data;
		} blob_value;
	} value;
} record_t;

typedef struct row_t {
	size_t length;
	record_t *records;
} row_t;

typedef struct result_t {
	size_t length;
	row_t *rows;
} result_t;

result_t *result_new(size_t length, row_t *restrict rows);
void result_free(result_t *result);

typedef struct query_baton_t {
	uv_work_t req;
	statement_t *statement;
	uv_async_t async;
	void (*c_callback)(struct query_baton_t *);
	void *js_callback;
	result_t *result;
} query_baton_t;

ASYNC_HEADER(query)

#ifdef __cplusplus
}
#endif

#endif /* __BS_RESULTS_H__ */