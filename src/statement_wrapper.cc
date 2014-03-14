#include "statement_wrapper.h"

using namespace v8;

static const char *const className = "StatementWrapper";

Persistent<Function> StatementWrapper::constructor;

StatementWrapper::StatementWrapper() : statement(NULL) {
}

StatementWrapper::~StatementWrapper() {
	if (statement != NULL) {
		statement_free(statement);
		statement = NULL;
	}
}

void StatementWrapper::Init(Handle<Object> exports) {
	// Prepare constructor template
	auto tpl = FunctionTemplate::New(New);
	tpl->SetClassName(String::NewSymbol(className));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	// Prototype
	constructor = Persistent<Function>::New(tpl->GetFunction());
	exports->Set(String::NewSymbol(className), constructor);
}

Handle<Value> StatementWrapper::New(const Arguments& args) {
	HandleScope scope;

	if (args.IsConstructCall()) {
		StatementWrapper *obj = new StatementWrapper();
		obj->Wrap(args.This());
		return args.This();
	} else {
		return scope.Close(constructor->NewInstance());
	}
}