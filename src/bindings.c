#include <stdlib.h>
#include "bindings.h"

static void open_baton_do(open_baton_t *restrict baton) {
	baton->result = sqlite3_open(baton->filename, &baton->db->sqlite_db);
}

static void open_baton_free_members(open_baton_t *restrict baton) {
	if (baton->filename != NULL) {
		free(baton->filename);
	}
}

SQLITE_BINDING(open);
	
static void close_baton_do(close_baton_t *restrict baton) {
	baton->result = sqlite3_close_v2(baton->db->sqlite_db);
}

static void close_baton_free_members(close_baton_t *restrict baton) {
}

SQLITE_BINDING(close);
