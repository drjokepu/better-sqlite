#include <node.h>
#include <uv.h>
#include <v8.h>
#include "bindings.h"
#include "db.h"
#include "db_wrapper.h"
#include "statement.h"
#include "statement_wrapper.h"

#define BS_UNKNOWN_TYPE (-9000)

using namespace v8;

static Handle<Value> ErrMsg(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 1) {
		ThrowException(Exception::TypeError(String::New("Expected at least one arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	DbWrapper *db_wrapper = node::ObjectWrap::Unwrap<DbWrapper>(Handle<Object>::Cast(args[0]));
	
	return scope.Close(String::New(errmsg_sync(db_wrapper->db)));
}

static int BindValue(statement_t *stmt, const int index, Handle<Value> value) {
	if (value->IsInt32()) {
		return bind_int_sync(stmt, index, value->Int32Value());
	} else if (value->IsNumber()) {
		const auto double_value = value->NumberValue();
		const auto int64_value = value->IntegerValue();
		
		if ((double)int64_value == double_value) {
			return bind_int64_sync(stmt, index, int64_value);
		} else {
			return bind_double_sync(stmt, index, double_value);
		}
	} else if (value->IsString()) {
		auto text = value->ToString();
		return bind_text_sync(stmt, index, strdup(*v8::String::Utf8Value(text)), text->Utf8Length());
	} else if (value->IsNull()) {
		return bind_null_sync(stmt, index);
	} else {
		return BS_UNKNOWN_TYPE;
	}
}

static Handle<Value> Bind(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 3) {
		ThrowException(Exception::TypeError(String::New("Expected at least three arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[2]->IsInt32()) {
	    ThrowException(Exception::TypeError(String::New("Third argument must be an integer.")));
	    return scope.Close(Undefined());
	}
	
	StatementWrapper *statement_wrapper = node::ObjectWrap::Unwrap<StatementWrapper>(Handle<Object>::Cast(args[0]));
	const int index = args[2]->Int32Value();
	const int binding_result = BindValue(statement_wrapper->statement, index, args[1]);
	
	if (binding_result != BS_UNKNOWN_TYPE) {
		return scope.Close(Integer::New(binding_result));
	} else {
	    ThrowException(Exception::TypeError(String::New("Unsupported object type.")));
	    return scope.Close(Undefined());
	}
}


static Handle<Value> Version(const Arguments& args) {
	HandleScope scope;
	return scope.Close(String::New(libversion_sync()));
}

static Handle<Value> Finalize(const Arguments& args) {
	HandleScope scope;
	if (args.Length() < 1) {
		ThrowException(Exception::TypeError(String::New("Expected at least one arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	StatementWrapper *statement_wrapper = node::ObjectWrap::Unwrap<StatementWrapper>(Handle<Object>::Cast(args[0]));
	const auto error_code = finalize_sync(statement_wrapper->statement);
	return scope.Close(Integer::New(error_code));
}

static void OpenCallback(open_baton_t *baton) {
	Local<Value> args[] = {
		Local<Value>::New(Integer::New(baton->result))
	};
	
	Persistent<Function> callback = static_cast<Function*>(baton->js_callback);
	callback->Call(Context::GetCurrent()->Global(), 1, args);
	callback.Dispose();
	open_baton_free(baton);
}

static Handle<Value> Open(const Arguments& args) {
	HandleScope scope;
	
	if (args.Length() < 3) {
		ThrowException(Exception::TypeError(String::New("Expected at least three arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[1]->IsString()) {
	    ThrowException(Exception::TypeError(String::New("Second argument must be a string.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[2]->IsFunction()) {
	    ThrowException(Exception::TypeError(String::New("Third argument must be a function.")));
	    return scope.Close(Undefined());
	}
	
	DbWrapper *db_wrapper = node::ObjectWrap::Unwrap<DbWrapper>(Handle<Object>::Cast(args[0]));
	
	auto db = db_new();
	auto baton = open_baton_new();
	
	baton->req.data = baton;
	baton->db = db;
	baton->filename = strdup(*v8::String::Utf8Value(args[1]->ToString()));
	baton->c_callback = OpenCallback;
	baton->js_callback = *Persistent<Function>::New(Handle<Function>::Cast(args[2]));
	db_wrapper->db = db;
	open_async(baton);
	
	return scope.Close(Undefined());
}

static void CloseCallback(close_baton_t *baton) {
	Local<Value> args[] = {
		Local<Value>::New(Integer::New(baton->result))
	};
	
	Persistent<Function> callback = static_cast<Function*>(baton->js_callback);
	callback->Call(Context::GetCurrent()->Global(), 1, args);
	callback.Dispose();
	close_baton_free(baton);
}

static Handle<Value> Close(const Arguments& args) {
	HandleScope scope;
	
	if (args.Length() < 2) {
		ThrowException(Exception::TypeError(String::New("Expected at least two arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[1]->IsFunction()) {
	    ThrowException(Exception::TypeError(String::New("Second argument must be a function.")));
	    return scope.Close(Undefined());
	}
	
	DbWrapper *db_wrapper = node::ObjectWrap::Unwrap<DbWrapper>(Handle<Object>::Cast(args[0]));
	auto baton = close_baton_new();
	
	baton->req.data = baton;
	baton->db = db_wrapper->db;
	baton->c_callback = CloseCallback;
	baton->js_callback = *Persistent<Function>::New(Handle<Function>::Cast(args[1]));
	close_async(baton);
	
	return scope.Close(Undefined());
}

static void PrepareCallback(prepare_baton_t *baton) {	
	Local<Value> args[] = {
		Local<Value>::New(Integer::New(baton->result))
	};
	
	Persistent<Function> callback = static_cast<Function*>(baton->js_callback);
	callback->Call(Context::GetCurrent()->Global(), 1, args);
	callback.Dispose();
	prepare_baton_free(baton);
}

static Handle<Value> Prepare(const Arguments& args) {
	HandleScope scope;
	
	if (args.Length() < 4) {
		ThrowException(Exception::TypeError(String::New("Expected at least three arguments.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[0]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("First argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[1]->IsObject()) {
	    ThrowException(Exception::TypeError(String::New("Second argument must be an object.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[2]->IsString()) {
	    ThrowException(Exception::TypeError(String::New("Third argument must be a string.")));
	    return scope.Close(Undefined());
	}
	
	if (!args[3]->IsFunction()) {
	    ThrowException(Exception::TypeError(String::New("Fourth argument must be a function.")));
	    return scope.Close(Undefined());
	}
	
	DbWrapper *db_wrapper = node::ObjectWrap::Unwrap<DbWrapper>(Handle<Object>::Cast(args[0]));
	StatementWrapper *statement_wrapper = node::ObjectWrap::Unwrap<StatementWrapper>(Handle<Object>::Cast(args[1]));
	
	auto statement = statement_new();
	auto baton = prepare_baton_new();
	auto sql = args[2]->ToString();
	
	baton->req.data = baton;
	baton->db = db_wrapper->db;
	baton->statement = statement;
	baton->sql = strdup(*v8::String::Utf8Value(sql));
	baton->sql_length = sql->Utf8Length();
	baton->c_callback = PrepareCallback;
	baton->js_callback = *Persistent<Function>::New(Handle<Function>::Cast(args[3]));
	statement_wrapper->statement = statement;
	prepare_async(baton);
	
	return scope.Close(Undefined());
}

static inline void AddFunction(Handle<Object> exports, const char *name, Handle<Value> (&function)(const Arguments&)) {
	exports->Set(String::NewSymbol(name), FunctionTemplate::New(function)->GetFunction());
}

static void ExportTypes(Handle<Object> exports) {
	DbWrapper::Init(exports);
	StatementWrapper::Init(exports);
}

static void ExportFunctions(Handle<Object> exports) {
	AddFunction(exports, "bind", Bind);
	AddFunction(exports, "close", Close);
	AddFunction(exports, "errMsg", ErrMsg);
	AddFunction(exports, "finalize", Finalize);
	AddFunction(exports, "open", Open);
	AddFunction(exports, "prepare", Prepare);
	AddFunction(exports, "version", Version);
}

static void Init(Handle<Object> exports) {
	ExportTypes(exports);
	ExportFunctions(exports);
}

NODE_MODULE(sqlite, Init)