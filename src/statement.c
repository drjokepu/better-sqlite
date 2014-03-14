#include <stdlib.h>
#include "statement.h"

statement_t *statement_new(void) {
	statement_t *statement = malloc(sizeof(statement_t));
	statement->sqlite_statement = NULL;
	return statement;
}

void statement_free(statement_t *statement) {
	free(statement);
}