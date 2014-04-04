#include <stdlib.h>
#include <string.h>
#include "results.h"

record_t *record_new(void) {
	record_t *record = calloc(1, sizeof(record_t));
	record->type = record_type_null;
	return record;
}

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

void record_free(record_t *record) {
	record_free_members(record);
	free(record);
}

row_t *row_new(size_t length, record_t *restrict records) {
	row_t *row = malloc(sizeof(row_t));
	row->length = length;
	
	const size_t record_array_size = length * sizeof(record_t);
	row->records = malloc(record_array_size);
	memcpy(row->records, records, record_array_size);
	
	return row;
}

static void row_free_members(row_t *row) {
	for (size_t i = 0; i < row->length; i++) {
		record_free_members(row->records + i);
	}
	free(row->records);
}

void row_free(row_t *row) {
	row_free_members(row);
	free(row);
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

result_set_t *result_set_new(size_t length, result_t *restrict results) {
	result_set_t *result_set = malloc(sizeof(result_set_t));
	result_set->length = length;
	
	const size_t result_array_size = length * sizeof(result_t);
	result_set->results = malloc(result_array_size);
	memcpy(result_set->results, results, result_array_size);
	
	return result_set;
}

static void result_set_free_members(result_set_t *result_set) {
	for (size_t i = 0; i < result_set->length; i++) {
		result_free_members(result_set->results + i);
	}
	free(result_set->results);
}

void result_set_free(result_set_t *result_set) {
	result_set_free_members(result_set);
	free(result_set);
}