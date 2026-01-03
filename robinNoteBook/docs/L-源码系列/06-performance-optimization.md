# 性能优化机制

V8通过多种机制优化JavaScript执行性能，主要包括内联缓存、隐藏类、反馈向量等。

## 内联缓存 (Inline Caches)

### IC概述
**位置**: `src/ic/`

内联缓存是V8优化属性访问和方法调用的核心机制。

#### IC状态
```cpp
enum ICState {
  UNINITIALIZED,    // 未初始化
  PREMONOMORPHIC,   // 预单态
  MONOMORPHIC,      // 单态
  RECOMPUTE_HANDLER,// 重新计算处理器
  POLYMORPHIC,      // 多态
  MEGAMORPHIC,      // 超多态
  GENERIC           // 通用
};
```

### 属性访问IC

#### LoadIC (属性加载)
```cpp
class LoadIC : public IC {
  void UpdateCaches(LookupIterator* lookup);
  Handle<Object> Load(Handle<Object> object, Handle<Name> name);
};
```

#### 优化策略
- **单态优化**: 对象类型固定时的快速访问
- **多态优化**: 少数几种类型的优化处理
- **超多态回退**: 类型过多时回退到通用处理

#### 示例优化过程
```javascript
// 初始状态: UNINITIALIZED
obj.prop;

// 第一次访问: MONOMORPHIC
// 缓存: obj的Map → prop的偏移量

// 相同类型访问: 直接使用缓存
obj2.prop; // obj2与obj同类型

// 不同类型访问: 转为POLYMORPHIC
obj3.prop; // obj3类型不同
```

### 方法调用IC

#### CallIC
```cpp
class CallIC : public IC {
  void HandleMiss(Handle<Object> function, Handle<Object> receiver);
  Handle<Object> Call(Handle<Object> callable, Handle<Object> receiver);
};
```

#### 优化技术
- **方法内联**: 将小方法直接内联到调用点
- **虚函数优化**: 基于类型信息的直接调用
- **参数特化**: 基于参数类型的优化

## 隐藏类系统

### Map转换链

#### 转换类型
```cpp
enum PropertyKind {
  kData,                // 数据属性
  kAccessor,           // 访问器属性
  kDataConstant        // 常量属性
};

enum PropertyLocation {
  kField,              // 字段属性
  kDescriptor          // 描述符属性
};
```

#### 转换示例
```javascript
// 空对象
let obj = {};           // Map0

// 添加属性x
obj.x = 1;             // Map0 → Map1

// 添加属性y  
obj.y = 2;             // Map1 → Map2

// 删除属性x
delete obj.x;          // Map2 → Map3 (慢属性)
```

### 属性存储优化

#### 快速属性
```cpp
class JSObject {
  // 内联属性: 直接存储在对象中
  Object* RawFastPropertyAt(FieldIndex index);
  
  // 外联属性: 存储在属性数组中
  PropertyArray* property_array();
};
```

#### 属性访问路径
1. **内联属性**: 对象 + 偏移量 → 值
2. **外联属性**: 对象 → 属性数组 + 索引 → 值
3. **字典属性**: 对象 → 字典 + 查找 → 值

### 元素存储优化

#### 元素类型
```cpp
enum ElementsKind {
  PACKED_SMI_ELEMENTS,          // 紧密Smi数组
  HOLEY_SMI_ELEMENTS,           // 稀疏Smi数组
  PACKED_DOUBLE_ELEMENTS,       // 紧密双精度数组
  HOLEY_DOUBLE_ELEMENTS,        // 稀疏双精度数组
  PACKED_ELEMENTS,              // 紧密对象数组
  HOLEY_ELEMENTS,               // 稀疏对象数组
  DICTIONARY_ELEMENTS           // 字典元素
};
```

#### 元素转换
```javascript
let arr = [1, 2, 3];          // PACKED_SMI_ELEMENTS
arr[10] = 4;                  // → HOLEY_SMI_ELEMENTS
arr[0] = 1.5;                 // → HOLEY_DOUBLE_ELEMENTS
arr[1] = "string";            // → HOLEY_ELEMENTS
```

## 反馈向量 (Feedback Vector)

### 类型反馈收集
**位置**: `src/objects/feedback-vector.h`

```cpp
class FeedbackVector : public HeapObject {
  Object* Get(FeedbackSlot slot);
  void Set(FeedbackSlot slot, Object* value);
  int invocation_count();
};
```

#### 反馈类型
- **类型信息**: 操作数的类型历史
- **调用目标**: 函数调用的目标信息
- **属性访问**: 属性访问的Map信息
- **元素访问**: 数组访问的元素类型

### 推测优化

#### 类型推测
```cpp
class TypeFeedbackOracle {
  CompareOperationHint GetCompareOperationHint(FeedbackSlot slot);
  BinaryOperationHint GetBinaryOperationHint(FeedbackSlot slot);
};
```

#### 优化决策
- **单态假设**: 假设类型不变
- **范围假设**: 假设数值在特定范围
- **不变性假设**: 假设某些属性不变

## 字符串优化

### 字符串表示
```cpp
class String : public Name {
  bool IsSeqString();           // 顺序字符串
  bool IsConsString();          // 连接字符串
  bool IsSlicedString();        // 切片字符串
  bool IsExternalString();      // 外部字符串
};
```

#### 字符串类型
- **SeqString**: 连续存储的字符串
- **ConsString**: 两个字符串的连接
- **SlicedString**: 另一个字符串的子串
- **ThinString**: 指向其他字符串的瘦指针

### 字符串优化技术

#### 字符串内化
```cpp
class StringTable {
  Handle<String> LookupString(Isolate* isolate, Handle<String> string);
  Handle<String> LookupKey(Isolate* isolate, StringTableKey* key);
};
```

#### 延迟连接
```javascript
// 不立即创建新字符串
let result = str1 + str2;  // 创建ConsString

// 访问时才展平
let char = result[0];      // 触发展平操作
```

## 数组优化

### 数组类型特化

#### 快速数组操作
```cpp
class JSArray : public JSObject {
  double length();
  void set_length(double length);
  FixedArrayBase* elements();
};
```

#### 优化技术
- **类型特化**: 基于元素类型的优化
- **边界检查消除**: 循环中的边界检查优化
- **内联展开**: 数组方法的内联优化

### 稀疏数组处理
```javascript
let arr = [];
arr[1000000] = 1;  // 转为字典模式，避免内存浪费
```

## 函数优化

### 函数内联
```cpp
class JSInliner {
  Reduction ReduceJSCall(Node* node);
  bool CanInlineFunction(Handle<SharedFunctionInfo> info);
};
```

#### 内联条件
- **函数大小**: 小函数优先内联
- **调用频率**: 热点调用优先内联
- **类型稳定**: 目标函数类型稳定

### 参数优化
- **参数特化**: 基于常见参数值的优化
- **参数消除**: 未使用参数的消除
- **this绑定优化**: this值的优化处理

## 性能监控

### 性能计数器
```cpp
class RuntimeCallStats {
  void Enter(RuntimeCallCounterId counter_id);
  void Leave(RuntimeCallCounterId counter_id);
  void Print();
};
```

### 优化跟踪
```bash
# 跟踪优化过程
d8 --trace-opt --trace-deopt script.js

# 查看IC状态
d8 --trace-ic script.js

# 性能分析
d8 --prof script.js
```