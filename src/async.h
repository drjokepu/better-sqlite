#ifndef __BS_ASYNC_H__
#define __BS_ASYNC_H__

#include <uv.h>

#ifdef __cplusplus
extern "C"
{
#endif
	
#define ASYNC(name) \
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

#define ASYNC_HEADER(name) \
name##_baton_t *name##_baton_new(void); \
void name##_baton_free(name##_baton_t *baton); \
void name##_async(name##_baton_t *baton);

#ifdef __cplusplus
}
#endif

#endif /* __BS_ASYNC_H__ */