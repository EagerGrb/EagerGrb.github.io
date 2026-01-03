# 运行时系统

V8的运行时系统包括对象系统、内存管理、执行上下文等核心组件。

## 对象系统

### 对象布局
**位置**: `src/objects/`

#### HeapObject基类
```cpp
class HeapObject {
  Map map();                    // 对象的Map
  int Size();                   // 对象大小
  bool IsJSObject();           // 类型检查
};
```

#### JSObject结构
```cpp
class JSObject : public HeapObject {
  FixedArray* properties();     // 属性数组
  FixedArray* elements();       // 元素数组
  Map map();                    // 隐藏类
};
```

### Hidden Classes (隐藏类)

#### Map对象
```cpp
class Map : public HeapObject {
  DescriptorArray* instance_descriptors();  // 属性描述符
  Map* prototype();                          // 原型对象
  int instance_size();                       // 实例大小
};
```

#### 属性访问优化
- **内联属性**: 直接存储在对象中
- **外联属性**: 存储在属性数组中
- **快速属性**: 基于偏移量的直接访问

#### 转换链
```
空对象 → 添加属性a → 添加属性b → 删除属性a
  Map0  →    Map1    →    Map2    →    Map3
```

### 属性存储

#### 属性类型
- **数据属性**: 普通值属性
- **访问器属性**: getter/setter属性
- **元素属性**: 数组索引属性

#### 存储策略
```cpp
enum PropertyKind {
  kData,                // 数据属性
  kAccessor,           // 访问器属性
  kDataConstant        // 常量属性
};
```

## 内存管理

### 堆结构
**位置**: `src/heap/`

#### 分代垃圾回收
```cpp
class Heap {
  NewSpace* new_space();        // 新生代
  OldSpace* old_space();        // 老生代
  LargeObjectSpace* lo_space(); // 大对象空间
};
```

#### 内存区域
- **新生代**: 短生命周期对象
- **老生代**: 长生命周期对象
- **大对象空间**: 大于页面大小的对象
- **代码空间**: 可执行代码

### 垃圾回收算法

#### 新生代GC (Scavenge)
```cpp
class Scavenger {
  void ScavengeObject(HeapObject* object);
  void EvacuateObject(HeapObject* object);
  void UpdatePointers();
};
```

**算法特点**:
- **复制算法**: From空间到To空间
- **快速回收**: 适合短生命周期对象
- **晋升机制**: 存活对象晋升到老生代

#### 老生代GC (Mark-Sweep-Compact)
```cpp
class MarkCompactCollector {
  void MarkLiveObjects();       // 标记存活对象
  void SweepSpaces();          // 清除死对象
  void CompactSpace();         // 压缩空间
};
```

**三阶段过程**:
1. **标记阶段**: 标记所有可达对象
2. **清除阶段**: 回收未标记对象
3. **压缩阶段**: 整理内存碎片

#### 增量标记
```cpp
class IncrementalMarking {
  void Start();                 // 开始增量标记
  void Step();                  // 执行标记步骤
  void Finalize();             // 完成标记
};
```

### 内存分配

#### 分配策略
```cpp
class AllocationSpace {
  HeapObject* AllocateRaw(int size);
  bool CanAllocate(int size);
  void Free(HeapObject* object);
};
```

#### 分配路径
1. **快速路径**: 线性分配指针
2. **慢速路径**: 空闲列表分配
3. **GC触发**: 空间不足时触发回收

## 执行上下文

### Context对象
**位置**: `src/execution/`

#### 上下文类型
```cpp
enum ContextType {
  FUNCTION_CONTEXT,     // 函数上下文
  BLOCK_CONTEXT,        // 块级上下文
  MODULE_CONTEXT,       // 模块上下文
  SCRIPT_CONTEXT        // 脚本上下文
};
```

#### 上下文链
```cpp
class Context : public HeapObject {
  Context* previous();          // 上级上下文
  ScopeInfo* scope_info();     // 作用域信息
  Object* get(int index);      // 获取变量
};
```

### 函数调用

#### 调用约定
```cpp
class CallInterfaceDescriptor {
  Register target();            // 目标函数寄存器
  Register new_target();        // new.target寄存器
  Register argument_count();    // 参数数量寄存器
};
```

#### 调用栈管理
- **栈帧结构**: 参数、局部变量、返回地址
- **栈溢出检测**: 防止无限递归
- **尾调用优化**: 优化尾递归调用

### 作用域链

#### 变量查找
```cpp
class ScopeIterator {
  Handle<Object> GetReceiver();
  Handle<String> GetFunctionDebugName();
  bool SetVariableValue(Handle<String> name, Handle<Object> value);
};
```

#### 闭包实现
- **捕获变量**: 闭包捕获的外部变量
- **上下文保存**: 保持外部作用域引用
- **内存管理**: 闭包的垃圾回收

## 类型系统

### 值表示
```cpp
class Object {
  bool IsSmi();                 // 小整数
  bool IsHeapObject();         // 堆对象
  bool IsString();             // 字符串
  bool IsJSFunction();         // 函数对象
};
```

#### Smi (Small Integer)
- **直接编码**: 31位整数直接编码在指针中
- **无分配开销**: 不需要堆分配
- **快速运算**: 直接进行算术运算

#### 装箱/拆箱
```cpp
// 装箱: 原始值 → 对象
Handle<Object> BoxValue(int32_t value);

// 拆箱: 对象 → 原始值  
int32_t UnboxValue(Handle<Object> object);
```

## 异常处理

### 异常机制
```cpp
class Isolate {
  Object* pending_exception();
  void set_pending_exception(Object* exception);
  void clear_pending_exception();
};
```

#### try-catch实现
- **异常表**: 记录异常处理器位置
- **栈展开**: 异常传播时的栈清理
- **finally块**: 确保finally代码执行

### 错误对象
```cpp
class JSError : public JSObject {
  String* message();            // 错误消息
  Object* stack_trace();        // 堆栈跟踪
};
```