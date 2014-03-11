#include <node.h>
#include <uv.h>
#include <v8.h>
#include "bindings.h"
#include "db.h"
#include "db_wrapper.h"

#include <cstdio>

using namespace v8;

static void OpenCallback(open_baton_t *baton);

Handle<Value> Open(const Arguments& args) {
	HandleScope scope;
	
	if (args.Length() < 3) {
		ThrowException(Exception::TypeError(String::New("Expected at least three arguments.")));
	    return scope.Close(Undefined());
	}
	
	DbWrapper *wrapper = node::ObjectWrap::Unwrap<DbWrapper>(Handle<Object>::Cast(args[0]));
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[1]->IsString()) {
	    ThrowException(Exception::TypeError(String::New("Second argument must be string.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[2]->IsFunction()) {
	    ThrowException(Exception::TypeError(String::New("Third argument must be a function.")));
	    return scope.Close(Undefined());
	}
	
	auto db = db_new();
	auto baton = open_baton_new();
	
	baton->req.data = baton;
	baton->db = db;
	baton->filename = strdup(*v8::String::Utf8Value(args[1]->ToString()));
	baton->c_callback = OpenCallback;
	baton->js_callback = *Persistent<Function>::New(Handle<Function>::Cast(args[2]));
	baton->wrapper = wrapper;
	sqlite3_open_async(baton);
	
	return scope.Close(Undefined());
}

static void OpenCallback(open_baton_t *baton) {
	auto wrapper = static_cast<DbWrapper*>(baton->wrapper);
	wrapper->db = baton->db;
	
	Local<Value> args[] = {
		Local<Value>::New(Integer::New(baton->result))
	};
	
	Persistent<Function> callback = static_cast<Function*>(baton->js_callback);
	callback->Call(Context::GetCurrent()->Global(), 1, args);
	callback.Dispose();
	open_baton_free(baton);
}

static void Init(Handle<Object> exports) {
	DbWrapper::Init(exports);
	
	exports->Set(String::NewSymbol("open"),
		FunctionTemplate::New(Open)->GetFunction());
}

NODE_MODULE(sqlite, Init)