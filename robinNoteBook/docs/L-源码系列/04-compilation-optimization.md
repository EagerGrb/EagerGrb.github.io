# 编译优化

V8采用分层编译架构，根据代码执行频率选择不同级别的优化编译器。

## 编译器层次

### 1. Sparkplug (基线编译器)
**位置**: `src/baseline/`

#### 设计特点
- **快速编译**: 字节码到机器码的直接翻译
- **无优化**: 保持原始执行语义
- **低延迟**: 编译时间极短

#### 编译流程
```
字节码 → 机器码模板 → 本地代码
```

#### 适用场景
- 函数首次编译
- 需要快速响应的代码
- 编译时间敏感的场景

### 2. Maglev (中级优化编译器)
**位置**: `src/maglev/`

#### 优化特性
- **类型特化**: 基于类型反馈的优化
- **内联**: 小函数内联
- **寄存器分配**: 高效的寄存器使用

#### 编译管道
```cpp
class MaglevCompiler {
  void BuildGraph();        // 构建IR图
  void OptimizeGraph();     // 图优化
  void GenerateCode();      // 代码生成
};
```

### 3. TurboFan (高级优化编译器)
**位置**: `src/compiler/`

#### 核心架构
- **Sea of Nodes**: 基于节点海的中间表示
- **多阶段优化**: 分阶段的优化管道
- **机器无关**: 支持多种目标架构

## TurboFan详细分析

### IR设计 (中间表示)

#### Node类
```cpp
class Node {
  Operator* op();           // 操作符
  InputIterator inputs();   // 输入节点
  UseIterator uses();       // 使用节点
};
```

#### 图结构
- **控制流图**: 表示程序控制流
- **数据流图**: 表示数据依赖关系
- **效应链**: 表示副作用顺序

### 优化阶段

#### 1. 图构建阶段
**位置**: `src/compiler/bytecode-graph-builder.cc`
```cpp
class BytecodeGraphBuilder {
  void VisitBytecode();     // 访问字节码
  Node* NewNode();          // 创建新节点
  void MergeControlToEnd(); // 合并控制流
};
```

#### 2. 类型化阶段
**位置**: `src/compiler/typer.cc`
- **类型推断**: 推断节点类型信息
- **范围分析**: 数值范围分析
- **类型特化**: 基于类型的优化

#### 3. 优化阶段
主要优化技术：

##### 内联优化
```cpp
class JSInliner {
  Reduction ReduceJSCall(Node* node);
  bool CanInlineFunction(SharedFunctionInfo* info);
};
```

##### 逃逸分析
```cpp
class EscapeAnalysis {
  void AnalyzeGraph();
  bool IsEscaping(Node* node);
  void EliminateAllocations();
};
```

##### 循环优化
- **循环不变量外提**: 将不变计算移出循环
- **循环展开**: 减少循环开销
- **循环向量化**: SIMD指令优化

#### 4. 代码生成阶段
**位置**: `src/compiler/code-generator.cc`
- **指令选择**: 选择目标机器指令
- **寄存器分配**: 物理寄存器分配
- **机器码生成**: 生成最终机器码

### 优化技术详解

#### 1. 内联缓存集成
```cpp
// IC状态影响优化决策
if (ic_state == MONOMORPHIC) {
  // 单态优化
  return OptimizeMonomorphicAccess(node);
} else if (ic_state == POLYMORPHIC) {
  // 多态优化
  return OptimizePolymorphicAccess(node);
}
```

#### 2. 类型反馈优化
- **Hidden Class信息**: 对象形状优化
- **类型历史**: 基于历史类型信息优化
- **推测优化**: 基于假设的激进优化

#### 3. 内存优化
- **对象分配消除**: 栈上分配替代堆分配
- **存储消除**: 冗余存储操作消除
- **加载消除**: 冗余加载操作消除

## 反优化机制

### Deoptimization
**位置**: `src/deoptimizer/`

#### 触发条件
- **类型假设失效**: 对象类型发生变化
- **Hidden Class变化**: 对象形状改变
- **函数重定义**: 函数被重新定义

#### 反优化过程
```cpp
class Deoptimizer {
  void MaterializeHeapObjects();  // 重建堆对象
  void WriteTranslatedFrame();    // 写入转换帧
  void DoComputeFrame();          // 计算帧信息
};
```

#### 状态恢复
1. **保存优化前状态**: 记录反优化点信息
2. **重建执行环境**: 恢复变量和调用栈
3. **切换到解释器**: 继续解释执行

## 编译决策

### 热点检测
```cpp
class OptimizationDecision {
  bool ShouldOptimize(JSFunction* function) {
    return function->feedback_vector()->invocation_count() > 
           FLAG_optimization_threshold;
  }
};
```

### 编译器选择策略
- **执行次数**: 基于调用频率
- **代码大小**: 小函数优先Maglev
- **优化潜力**: 类型稳定性评估

## 性能监控

### 编译统计
- 编译时间统计
- 优化成功率
- 反优化频率

### 调试工具
```bash
# 查看优化状态
d8 --trace-opt script.js

# 查看反优化
d8 --trace-deopt script.js

# 查看编译器选择
d8 --trace-opt-verbose script.js
```