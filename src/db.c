#include <stdlib.h>
#include "db.h"

db_t *db_new(void) {
	return calloc(1, sizeof(db_t));
}

void db_free(db_t *db) {
	free(db);
}