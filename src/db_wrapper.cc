#include <cstdio>
#include "db_wrapper.h"

using namespace v8;

static const char *const className = "DbWrapper";

Persistent<Function> DbWrapper::constructor;

DbWrapper::DbWrapper() : db(NULL) {
}

DbWrapper::~DbWrapper() {
	if (db != NULL) {
		db_free(db);
		db = NULL;
	}
}

void DbWrapper::Init(Handle<Object> exports) {
	// Prepare constructor template
	auto tpl = FunctionTemplate::New(New);
	tpl->SetClassName(String::NewSymbol(className));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// Prototype
	constructor = Persistent<Function>::New(tpl->GetFunction());
	exports->Set(String::NewSymbol(className), constructor);
}

Handle<Value> DbWrapper::New(const Arguments& args) {
	HandleScope scope;

	if (args.IsConstructCall()) {
		DbWrapper *obj = new DbWrapper();
		obj->Wrap(args.This());
		return args.This();
	} else {
		return scope.Close(constructor->NewInstance());
	}
}