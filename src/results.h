#ifndef __BS_RESULTS_H__
#define __BS_RESULTS_H__

#include <stddef.h>
#include "sqlite3/sqlite3.h"

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

record_t *record_new(void);
void record_free(record_t *record);

typedef struct row_t {
	size_t length;
	record_t *records;
} row_t;

row_t *row_new(size_t length, record_t *restrict records);
void row_free(row_t *row);

typedef struct result_t {
	size_t length;
	row_t *rows;
} result_t;

typedef struct result_set_t {
	size_t length;
	row_t *rows;
} result_set_t;

#ifdef __cplusplus
}
#endif

#endif /* __BS_RESULTS_H__ */