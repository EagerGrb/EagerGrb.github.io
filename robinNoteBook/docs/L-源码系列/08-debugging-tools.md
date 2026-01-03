# 调试分析工具

V8提供了丰富的调试和性能分析工具，帮助开发者理解和优化JavaScript代码。

## 调试支持

### 调试器接口
**位置**: `src/debug/`

#### Debug类
```cpp
class Debug {
  void SetBreakPoint(Handle<SharedFunctionInfo> shared,
                    Handle<BreakPoint> break_point);
  void ClearBreakPoint(Handle<BreakPoint> break_point);
  void PrepareStepIn(Handle<JSFunction> function);
  void PrepareStepNext();
  void PrepareStepOut();
};
```

#### 断点机制
```cpp
class BreakPoint {
  int id();                     // 断点ID
  int source_position();        // 源码位置
  Handle<Object> condition();   // 断点条件
};
```

### 源码映射

#### 位置信息
```cpp
class SourcePosition {
  int ScriptOffset();           // 脚本偏移量
  int InliningId();            // 内联ID
  bool IsKnown();              // 位置是否已知
};
```

#### 调用栈跟踪
```cpp
class StackTrace {
  Handle<StackFrameInfo> GetFrame(int index);
  int GetFrameCount();
  Handle<String> ToString();
};
```

## 性能分析工具

### CPU Profiler
**位置**: `src/profiler/`

#### 采样分析器
```cpp
class CpuProfiler {
  void StartProfiling(Handle<String> title);
  CpuProfile* StopProfiling(Handle<String> title);
  void SetSamplingInterval(int us);
};
```

#### 调用树构建
```cpp
class ProfileTree {
  ProfileNode* AddPathFromEnd(const std::vector<CodeEntry*>& path);
  void AddSample(ProfileNode* node, int count);
  ProfileNode* root();
};
```

### 堆分析器

#### 堆快照
```cpp
class HeapProfiler {
  const HeapSnapshot* TakeHeapSnapshot();
  void StartTrackingHeapObjects();
  void StopTrackingHeapObjects();
};
```

#### 对象统计
```cpp
class HeapObjectsMap {
  SnapshotObjectId FindEntry(Address addr);
  void AddEntry(Address addr, SnapshotObjectId id);
  void RemoveDeadEntries();
};
```

## d8调试工具

### 命令行选项

#### 优化跟踪
```bash
# 跟踪优化过程
d8 --trace-opt script.js

# 跟踪反优化
d8 --trace-deopt script.js

# 跟踪内联
d8 --trace-inlining script.js
```

#### 编译信息
```bash
# 显示字节码
d8 --print-bytecode script.js

# 显示优化代码
d8 --print-opt-code script.js

# 显示反汇编
d8 --print-code script.js
```

#### 内存分析
```bash
# GC跟踪
d8 --trace-gc script.js

# 堆统计
d8 --heap-stats script.js

# 内存使用
d8 --trace-gc-verbose script.js
```

### 内置调试函数

#### 优化控制
```javascript
// 标记函数为优化
%OptimizeFunctionOnNextCall(func);

// 强制反优化
%DeoptimizeFunction(func);

// 检查优化状态
%GetOptimizationStatus(func);
```

#### 对象检查
```javascript
// 检查对象类型
%HasFastProperties(obj);
%HasFastElements(obj);
%HasDictionaryElements(obj);

// 检查Hidden Class
%HaveSameMap(obj1, obj2);
%DebugPrint(obj);
```

## 性能监控

### 运行时统计
**位置**: `src/logging/`

#### 计数器系统
```cpp
class RuntimeCallStats {
  void Enter(RuntimeCallCounterId counter_id);
  void Leave(RuntimeCallCounterId counter_id);
  void Print(std::ostream& os);
};
```

#### 统计类别
- **编译时间**: 各编译器的编译耗时
- **GC时间**: 垃圾回收耗时
- **运行时调用**: 运行时函数调用统计
- **IC统计**: 内联缓存命中率

### 内存使用监控

#### 堆统计
```cpp
class HeapStats {
  size_t total_heap_size();
  size_t used_heap_size();
  size_t heap_size_limit();
  size_t total_available_size();
};
```

#### 空间统计
```cpp
class SpaceStatistics {
  size_t size();                // 空间大小
  size_t capacity();            // 空间容量
  size_t available();           // 可用空间
  size_t physical_size();       // 物理大小
};
```

## 代码覆盖率

### 覆盖率收集
**位置**: `src/debug/debug-coverage.cc`

```cpp
class Coverage {
  void SelectMode(CoverageMode mode);
  std::unique_ptr<Coverage> Collect();
  void Reset();
};
```

#### 覆盖率模式
- **最佳努力**: 基于现有信息的覆盖率
- **块覆盖**: 基本块级别的覆盖率
- **精确覆盖**: 精确的语句覆盖率

### 覆盖率数据
```cpp
class CoverageFunction {
  Handle<String> name();        // 函数名
  size_t start_offset();        // 开始位置
  size_t end_offset();          // 结束位置
  uint32_t count();            // 执行次数
};
```

## 类型反馈可视化

### IC状态查看
```bash
# 跟踪IC状态变化
d8 --trace-ic script.js

# 输出示例:
# [LoadIC in ~+34 at script.js:2 (0->.) map=0x... handler=0x...]
```

### 反馈向量分析
```javascript
// 查看函数的反馈向量
%DebugPrint(%GetFeedback(func));
```

## 编译器可视化

### TurboFan图可视化

#### Turbolizer工具
```bash
# 生成优化图
d8 --trace-turbo script.js

# 使用Turbolizer查看
# tools/turbolizer/turbolizer.html
```

#### 图阶段
- **字节码图**: 从字节码构建的初始图
- **优化图**: 各优化阶段的图变化
- **机器码图**: 最终的机器码表示

### 字节码可视化
```bash
# 详细字节码信息
d8 --print-bytecode --print-bytecode-filter=functionName script.js
```

## 内存泄漏检测

### 堆快照比较
```javascript
// 生成堆快照
let snapshot1 = %TakeHeapSnapshot();
// ... 执行代码
let snapshot2 = %TakeHeapSnapshot();

// 比较快照找出内存增长
```

### 对象跟踪
```cpp
class HeapObjectsTracker {
  void StartTracking();
  void StopTracking();
  SnapshotObjectId GetObjectId(Address object_addr);
};
```

## 性能基准测试

### 微基准测试
```javascript
// 使用%BenchMaglev和%BenchTurbofan
function testFunction() {
  // 测试代码
}

// 预热
for (let i = 0; i < 1000; i++) testFunction();

// 基准测试
let result = %BenchTurbofan(testFunction, 10000);
console.log(`Average time: ${result}ms`);
```

### 编译时间测量
```bash
# 测量编译时间
d8 --trace-opt-verbose --trace-compile script.js
```