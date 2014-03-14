#ifndef __BS_STATEMENT_H__
#define __BS_STATEMENT_H__

#include "sqlite3/sqlite3.h"

#ifdef __cplusplus
extern "C"
{
#endif

typedef struct statement_t {
	sqlite3_stmt *sqlite_statement;
} statement_t;

statement_t *statement_new(void);
void statement_free(statement_t *db);

#ifdef __cplusplus
}
#endif

#endif /* __BS_STATEMENT_H__ */