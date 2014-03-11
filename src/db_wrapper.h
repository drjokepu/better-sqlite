#ifndef __BS_DB_WRAPPER_H__
#define __BS_DB_WRAPPER_H__

#include <node.h>
#include "db.h"

class DbWrapper : public node::ObjectWrap {
public:
	db_t *db;
	static void Init(v8::Handle<v8::Object> exports);

private:
	DbWrapper();
	~DbWrapper();
	static v8::Handle<v8::Value> New(const v8::Arguments& args);
	static v8::Persistent<v8::Function> constructor;
};

#endif /* __BS_DB_WRAPPER_H__ */