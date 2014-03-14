#ifndef __BS_STATEMENT_WRAPPER_H__
#define __BS_STATEMENT_WRAPPER_H__

#include <node.h>
#include "statement.h"

class StatementWrapper final : public node::ObjectWrap {
public:
	statement_t *statement;
	static void Init(v8::Handle<v8::Object> exports);

private:
	StatementWrapper();
	~StatementWrapper();
	static v8::Handle<v8::Value> New(const v8::Arguments& args);
	static v8::Persistent<v8::Function> constructor;
};

#endif /* __BS_STATEMENT_WRAPPER_H__ */