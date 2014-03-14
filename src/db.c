#include <stdlib.h>
#include "db.h"

db_t *db_new(void) {
	db_t *db = malloc(sizeof(db_t));
	db->sqlite_db = NULL;
	return db;
}

void db_free(db_t *db) {
	free(db);
}