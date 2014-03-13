#include <stdlib.h>
#include "bindings.h"

#include <stdio.h>

// open

open_baton_t *open_baton_new(void) {
	open_baton_t *baton = malloc(sizeof(open_baton_t));
	baton->db = NULL;
	baton->filename = NULL;
	baton->c_callback = NULL;
	baton->js_callback = NULL;
	baton->wrapper = NULL;
	baton->result = 0;
	return baton;
}

void open_baton_free(open_baton_t *baton) {
	if (baton->filename != NULL) {
		free(baton->filename);
		baton->filename = NULL;
	}
	baton->wrapper = NULL;
	baton->c_callback = NULL;
	baton->js_callback = NULL;
	uv_close((uv_handle_t*)&baton->async, NULL);
}

static void sqlite3_open_async_begin(void *arg) {
	open_baton_t *baton = (open_baton_t*)arg;
	baton->result = sqlite3_open(baton->filename, &baton->db->sqlite_db);
	uv_async_send(&baton->async);
}

static void sqlite3_open_async_end(uv_async_t *handle, int status) {
	open_baton_t* baton = (open_baton_t*)handle->data;
	baton->c_callback(baton);
}

void sqlite3_open_async(open_baton_t *baton) {
	uv_thread_t thread_id;
	uv_async_init(uv_default_loop(), &baton->async, sqlite3_open_async_end);
	baton->async.data = baton;
	uv_thread_create(&thread_id, sqlite3_open_async_begin, baton);
}

// close

close_baton_t *close_baton_new(void) {
	close_baton_t *baton = malloc(sizeof(close_baton_t));
	baton->db = NULL;
	baton->c_callback = NULL;
	baton->js_callback = NULL;
	baton->result = 0;
	return baton;
}

void close_baton_free(close_baton_t *baton) {
	baton->c_callback = NULL;
	baton->js_callback = NULL;
	uv_close((uv_handle_t*)&baton->async, NULL);
}

static void sqlite3_close_async_begin(void *arg) {
	close_baton_t *baton = (close_baton_t*)arg;
	baton->result = sqlite3_close_v2(baton->db->sqlite_db);
	uv_async_send(&baton->async);
}

static void sqlite3_close_async_end(uv_async_t *handle, int status) {
	close_baton_t* baton = (close_baton_t*)handle->data;
	baton->c_callback(baton);
}

void sqlite3_close_async(close_baton_t *baton) {
	uv_thread_t thread_id;
	uv_async_init(uv_default_loop(), &baton->async, sqlite3_close_async_end);
	baton->async.data = baton;
	uv_thread_create(&thread_id, sqlite3_close_async_begin, baton);
}