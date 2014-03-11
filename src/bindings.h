#ifndef __BS_BINDINGS_H__
#define __BS_BINDINGS_H__

#include <sqlite3.h>
#include <uv.h>
#include "db.h"

#ifdef __cplusplus
extern "C"
{
#endif

typedef struct open_baton_t {
	uv_work_t req;
	db_t *db;
	char *filename;
	uv_async_t async;
	void (*c_callback)(struct open_baton_t *);
	void *js_callback;
	void *wrapper;
	int result;
} open_baton_t;

open_baton_t *open_baton_new(void);
void open_baton_free(open_baton_t *baton);
void sqlite3_open_async(open_baton_t *baton);

#ifdef __cplusplus
}
#endif

#endif /* __BS_BINDINGS_H__ */