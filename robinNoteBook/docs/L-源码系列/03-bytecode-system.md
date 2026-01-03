# 字节码系统 (Ignition)

## 字节码概述

Ignition是V8的字节码解释器，将AST转换为紧凑的字节码指令序列。

### 设计目标
- **内存效率**: 减少内存占用
- **启动性能**: 快速开始执行
- **优化基础**: 为后续编译优化提供信息

## 字节码生成

### BytecodeGenerator
**位置**: `src/interpreter/bytecode-generator.cc`

#### 生成流程
```
AST节点 → 访问者模式 → 字节码指令 → 字节码数组
```

#### 核心方法
```cpp
class BytecodeGenerator {
  void VisitVariableDeclaration(VariableDeclaration* node);
  void VisitFunctionLiteral(FunctionLiteral* node);
  void VisitBinaryOperation(BinaryOperation* node);
  void VisitCallExpression(Call* node);
};
```

## 字节码指令集

### 指令分类
**位置**: `src/interpreter/bytecodes.h`

#### 1. 加载/存储指令
- `LdaGlobal`: 加载全局变量
- `StaGlobal`: 存储全局变量
- `LdaNamedProperty`: 加载对象属性
- `StaNamedProperty`: 存储对象属性

#### 2. 算术运算指令
- `Add`: 加法运算
- `Sub`: 减法运算
- `Mul`: 乘法运算
- `Div`: 除法运算

#### 3. 比较指令
- `TestEqual`: 相等比较
- `TestLessThan`: 小于比较
- `TestGreaterThan`: 大于比较

#### 4. 控制流指令
- `Jump`: 无条件跳转
- `JumpIfTrue`: 条件跳转(真)
- `JumpIfFalse`: 条件跳转(假)

#### 5. 函数调用指令
- `CallProperty`: 方法调用
- `CallUndefinedReceiver`: 函数调用
- `Construct`: 构造函数调用

## 寄存器模型

### 虚拟寄存器
- **累加器**: 主要操作数寄存器
- **局部寄存器**: 存储局部变量
- **参数寄存器**: 函数参数

### 寄存器分配
```cpp
class BytecodeRegisterAllocator {
  Register NewRegister();           // 分配新寄存器
  void ReleaseRegister(Register r); // 释放寄存器
  Register accumulator();           // 累加器寄存器
};
```

## 字节码解释器

### Interpreter类
**位置**: `src/interpreter/interpreter.cc`

#### 执行循环
```cpp
class Interpreter {
  // 字节码分发表
  static const DispatchTable dispatch_table_;
  
  // 执行字节码
  static void DoLdaGlobal(InterpreterAssembler* assembler);
  static void DoStaGlobal(InterpreterAssembler* assembler);
  static void DoAdd(InterpreterAssembler* assembler);
};
```

#### 分发机制
- **直接分发**: 基于字节码操作码的跳转表
- **内联缓存**: 优化属性访问和方法调用
- **异常处理**: try-catch-finally的字节码实现

## 字节码优化

### 窥孔优化
- 相邻指令合并
- 冗余指令消除
- 常量传播

### 寄存器优化
- 寄存器复用
- 生命周期分析
- 溢出处理

## 调试支持

### 调试信息
- **源码位置映射**: 字节码到源码的映射
- **断点支持**: 调试器断点设置
- **堆栈跟踪**: 错误时的调用栈信息

### 字节码可视化
```bash
# 使用d8查看字节码
d8 --print-bytecode script.js
```

## 性能特征

### 优势
- **内存占用小**: 比AST节省内存
- **启动快**: 无需编译时间
- **缓存友好**: 紧凑的指令格式

### 劣势
- **执行开销**: 解释执行比机器码慢
- **分发成本**: 指令分发的额外开销

## 与编译器的交互

### 热点检测
- 执行计数器
- 循环检测
- 函数调用频率

### 优化触发
```cpp
// 热点代码标记为优化候选
if (function->IsOptimizable() && 
    function->execution_count() > threshold) {
  MarkForOptimization(function);
}
```