# 内置功能

V8实现了JavaScript的所有内置对象和函数，包括Array、Object、Function等核心API。

## 内置函数架构

### Builtins系统
**位置**: `src/builtins/`

#### 内置函数类型
```cpp
enum class Builtin {
  kArrayPrototypeMap,           // Array.prototype.map
  kArrayPrototypeFilter,        // Array.prototype.filter
  kObjectPrototypeToString,     // Object.prototype.toString
  kFunctionPrototypeCall,       // Function.prototype.call
  // ... 更多内置函数
};
```

#### 实现方式
- **C++实现**: 性能关键的内置函数
- **JavaScript实现**: 复杂逻辑的内置函数
- **CodeStub**: 汇编优化的内置函数
- **TurboFan内置**: 编译器生成的内置函数

## Array内置函数

### Array.prototype.map
**位置**: `src/builtins/builtins-array.cc`

```cpp
BUILTIN(ArrayPrototypeMap) {
  HandleScope scope(isolate);
  
  // 获取this值和callback
  Handle<Object> receiver = args.receiver();
  Handle<Object> callback = args.atOrUndefined(isolate, 1);
  
  // 类型检查和转换
  Handle<JSReceiver> object;
  ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
      isolate, object, Object::ToObject(isolate, receiver));
      
  // 获取length属性
  Handle<Object> length_object;
  ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
      isolate, length_object,
      Object::GetProperty(isolate, object, isolate->factory()->length_string()));
      
  // 执行map操作
  return MapProcessor(isolate, object, callback, length);
}
```

#### 优化策略
- **快速路径**: 针对常见数组类型的优化
- **类型特化**: 基于元素类型的特化实现
- **内联展开**: 简单callback的内联

### Array.prototype.forEach
```cpp
// 快速路径检查
if (array->IsJSArray() && callback->IsJSFunction()) {
  return ForEachFastPath(isolate, array, callback);
}
// 通用路径
return ForEachGeneric(isolate, object, callback);
```

## Object内置函数

### Object.prototype.toString
**位置**: `src/builtins/builtins-object.cc`

```cpp
BUILTIN(ObjectPrototypeToString) {
  HandleScope scope(isolate);
  Handle<Object> receiver = args.receiver();
  
  // 获取@@toStringTag
  Handle<Object> tag;
  ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
      isolate, tag,
      JSReceiver::GetProperty(isolate, Handle<JSReceiver>::cast(receiver),
                             isolate->factory()->to_string_tag_symbol()));
                             
  // 生成字符串表示
  return GenerateToStringResult(isolate, receiver, tag);
}
```

### Object.defineProperty
```cpp
BUILTIN(ObjectDefineProperty) {
  // 参数验证
  Handle<Object> target = args.atOrUndefined(isolate, 1);
  Handle<Object> key = args.atOrUndefined(isolate, 2);
  Handle<Object> attributes = args.atOrUndefined(isolate, 3);
  
  // 调用内部实现
  RETURN_RESULT_OR_FAILURE(
      isolate, JSReceiver::DefineProperty(isolate, target, key, attributes));
}
```

## Function内置函数

### Function.prototype.call
**位置**: `src/builtins/builtins-function.cc`

```cpp
BUILTIN(FunctionPrototypeCall) {
  HandleScope scope(isolate);
  
  // 获取目标函数
  Handle<Object> target = args.receiver();
  if (!target->IsCallable()) {
    THROW_NEW_ERROR_RETURN_FAILURE(
        isolate, NewTypeError(MessageTemplate::kCalledNonCallable, target));
  }
  
  // 获取this值和参数
  Handle<Object> this_arg = args.atOrUndefined(isolate, 1);
  int argc = std::max(0, args.length() - 2);
  
  // 执行调用
  return Execution::Call(isolate, target, this_arg, argc, args.data() + 2);
}
```

### Function.prototype.bind
```cpp
BUILTIN(FunctionPrototypeBind) {
  // 创建绑定函数
  Handle<JSBoundFunction> bound_function = 
      isolate->factory()->NewJSBoundFunction(target, bound_this, bound_args);
      
  // 设置length属性
  int length = std::max(0, target_length - bound_args->length());
  bound_function->set_length(length);
  
  return *bound_function;
}
```

## String内置函数

### String.prototype.substring
**位置**: `src/builtins/builtins-string.cc`

```cpp
BUILTIN(StringPrototypeSubstring) {
  HandleScope scope(isolate);
  
  // 转换为字符串
  Handle<String> string;
  ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
      isolate, string, Object::ToString(isolate, args.receiver()));
      
  // 获取参数
  int start = 0, end = string->length();
  if (args.length() > 1) {
    ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
        isolate, start, Object::ToInteger(isolate, args.at(1)));
  }
  
  // 执行substring操作
  return *isolate->factory()->NewSubString(string, start, end);
}
```

#### 字符串优化
- **子字符串共享**: 避免复制，共享原字符串
- **扁平化延迟**: 延迟字符串扁平化操作
- **内化缓存**: 常用字符串的内化

## Promise内置函数

### Promise构造函数
**位置**: `src/builtins/builtins-promise.cc`

```cpp
BUILTIN(PromiseConstructor) {
  HandleScope scope(isolate);
  
  // 检查new.target
  Handle<Object> new_target = args.new_target();
  if (new_target->IsUndefined(isolate)) {
    THROW_NEW_ERROR_RETURN_FAILURE(
        isolate, NewTypeError(MessageTemplate::kNotAPromise));
  }
  
  // 创建Promise对象
  Handle<JSPromise> promise = Handle<JSPromise>::cast(
      JSObject::New(target, new_target, Handle<AllocationSite>::null()));
      
  // 执行executor
  return ExecutePromiseExecutor(isolate, promise, executor);
}
```

### Promise.prototype.then
```cpp
BUILTIN(PromisePrototypeThen) {
  // 创建新的Promise
  Handle<JSPromise> result_promise = 
      NewPromiseCapability(isolate, constructor);
      
  // 添加reaction
  Handle<PromiseReaction> reaction = 
      isolate->factory()->NewPromiseReaction(
          result_promise, on_fulfilled, on_rejected);
          
  // 根据Promise状态处理
  if (promise->status() == Promise::kPending) {
    // 添加到reaction列表
    AddToReactionList(promise, reaction);
  } else {
    // 立即触发reaction
    TriggerPromiseReaction(isolate, reaction, promise);
  }
  
  return *result_promise;
}
```

## 正则表达式

### RegExp构造函数
**位置**: `src/builtins/builtins-regexp.cc`

```cpp
BUILTIN(RegExpConstructor) {
  HandleScope scope(isolate);
  
  // 解析模式和标志
  Handle<String> pattern = GetPattern(isolate, args.at(1));
  Handle<String> flags = GetFlags(isolate, args.at(2));
  
  // 编译正则表达式
  Handle<JSRegExp> regexp = JSRegExp::New(isolate, pattern, flags);
  
  return *regexp;
}
```

### RegExp.prototype.exec
```cpp
BUILTIN(RegExpPrototypeExec) {
  // 获取lastIndex
  int last_index = GetLastIndex(isolate, regexp);
  
  // 执行匹配
  Handle<Object> result = RegExpExecInternal(
      isolate, regexp, string, last_index);
      
  // 更新lastIndex
  if (regexp->global() || regexp->sticky()) {
    SetLastIndex(isolate, regexp, new_last_index);
  }
  
  return *result;
}
```

## 数学函数

### Math.max
**位置**: `src/builtins/builtins-math.cc`

```cpp
BUILTIN(MathMax) {
  HandleScope scope(isolate);
  
  double result = -V8_INFINITY;
  for (int i = 1; i < args.length(); ++i) {
    Handle<Object> arg = args.at(i);
    
    // 转换为数字
    Handle<Object> number;
    ASSIGN_RETURN_FAILURE_ON_EXCEPTION(
        isolate, number, Object::ToNumber(isolate, arg));
        
    double value = number->Number();
    if (std::isnan(value)) return ReadOnlyRoots(isolate).nan_value();
    
    result = std::max(result, value);
  }
  
  return *isolate->factory()->NewNumber(result);
}
```

## 类型转换

### ToString转换
```cpp
Handle<String> Object::ToString(Isolate* isolate, Handle<Object> input) {
  if (input->IsString()) return Handle<String>::cast(input);
  
  if (input->IsNumber()) {
    return isolate->factory()->NumberToString(input);
  }
  
  if (input->IsBoolean()) {
    return input->IsTrue(isolate) ? 
           isolate->factory()->true_string() :
           isolate->factory()->false_string();
  }
  
  // 调用对象的toString方法
  return CallToStringMethod(isolate, input);
}
```

### ToNumber转换
```cpp
Handle<Object> Object::ToNumber(Isolate* isolate, Handle<Object> input) {
  if (input->IsNumber()) return input;
  
  if (input->IsString()) {
    return String::ToNumber(isolate, Handle<String>::cast(input));
  }
  
  if (input->IsBoolean()) {
    return isolate->factory()->NewNumber(input->IsTrue(isolate) ? 1 : 0);
  }
  
  // 调用对象的valueOf方法
  return CallValueOfMethod(isolate, input);
}
```