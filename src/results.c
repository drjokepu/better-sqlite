#include <stdlib.h>
#include <string.h>
#include "results.h"
#include "sqlite3/sqlite3.h"

static void record_free_members(record_t *record) {
	switch (record->type) {
		case record_type_text:
			free(record->value.text_value.text);
			break;
		case record_type_blob:
			free(record->value.blob_value.data);
			break;
		default:
			break; // no members to free
	}
}

static void row_free_members(row_t *row) {
	for (size_t i = 0; i < row->length; i++) {
		record_free_members(row->records + i);
	}
	free(row->records);
}

result_t *result_new(size_t length, row_t *restrict rows) {
	result_t *result = malloc(sizeof(result_t));
	result->length = length;
	
	const size_t row_array_size = length * sizeof(row_t);
	result->rows = malloc(row_array_size);
	memcpy(result->rows, rows, row_array_size);
	
	return result;
}

static void result_free_members(result_t *result) {
	for (size_t i = 0; i < result->length; i++) {
		row_free_members(result->rows + i);
	}
	free(result->rows);
}

void result_free(result_t *result) {
	result_free_members(result);
	free(result);
}

//
// query
// -----

static char* copy_string(const char* restrict src, size_t *restrict out_length) {
	const size_t str_length = strlen(src);
	const size_t mem_length = str_length + 1;
	char *dst = malloc(mem_length);
	memcpy(dst, src, mem_length);
	
	if (out_length != NULL) {
		*out_length = str_length;
	}
	
	return dst;
}

static void query_read_record(sqlite3_stmt *stmt, int column_index, record_t *restrict record) {
	switch(sqlite3_column_type(stmt, column_index)) {
		case SQLITE_INTEGER:
			record->type = record_type_integer;
			record->value.integer_value = sqlite3_column_int64(stmt, column_index);
			break;
		case SQLITE_FLOAT:
			record->type = record_type_float;
			record->value.float_value = sqlite3_column_double(stmt, column_index);
			break;
		case SQLITE_TEXT:
			record->type = record_type_text;
			record->value.text_value.text = copy_string((const char*)sqlite3_column_text(stmt, column_index),
				&record->value.text_value.length);
			break;
		case SQLITE_NULL:
		default: // return null for unsupported types
			record->type = record_type_null;
			break;
	}
}

static void query_read_row(sqlite3_stmt *stmt, row_t *restrict row) {
	const int record_count = sqlite3_column_count(stmt);
	record_t *records = malloc(record_count * sizeof(record_t));
	for (int i = 0; i < record_count; i++) {
		query_read_record(stmt, i, records + i);
	}
	
	row->length = record_count;
	row->records = records;
}

static result_t *query_get_result(sqlite3_stmt *stmt) {
	int step_result;
	unsigned int row_count = 0;
	unsigned int row_capacity = 64;
	row_t *rows = malloc(row_capacity * sizeof(row_t));
	
	while ((step_result = sqlite3_step(stmt)) == SQLITE_ROW) {
		if (row_count == row_capacity) {
			row_capacity *= 2;
			rows = realloc(rows, row_capacity);
		}
		query_read_row(stmt, rows + (row_count++));
	}
	
	result_t *result = result_new(row_count, rows);
	free(rows);
	return result; 
}

static void query_baton_do(query_baton_t *restrict baton) {
	baton->result = query_get_result(baton->statement->sqlite_statement);
}

static void query_baton_free_members(query_baton_t *restrict baton) {
}

ASYNC(query);