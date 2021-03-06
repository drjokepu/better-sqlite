#ifndef __BS_DB_H__
#define __BS_DB_H__

#include "sqlite3/sqlite3.h"

#ifdef __cplusplus
extern "C"
{
#endif

typedef struct db_t {
	sqlite3 *sqlite_db;
} db_t;

db_t *db_new(void);
void db_free(db_t *db);

#ifdef __cplusplus
}
#endif

#endif /* __BS_DB_H__ */