# V8架构总览

## 整体架构

V8引擎采用多层编译架构，从JavaScript源码到机器码执行的完整流程：

```
JavaScript源码
    ↓
词法分析 & 语法分析 (Parser)
    ↓
抽象语法树 (AST)
    ↓
字节码生成 (Ignition)
    ↓
解释执行 / 优化编译
    ↓
机器码执行
```

## 核心组件

### 1. 解析器 (Parser)
- **位置**: `src/parsing/`
- **功能**: 将JavaScript源码转换为AST
- **关键文件**: `parser.cc`, `scanner.cc`

### 2. 字节码解释器 (Ignition)
- **位置**: `src/interpreter/`
- **功能**: 生成和执行字节码
- **特点**: 内存效率高，启动快

### 3. 编译器层次
- **Sparkplug**: `src/baseline/` - 基线编译器
- **Maglev**: `src/maglev/` - 中级优化编译器  
- **TurboFan**: `src/compiler/` - 高级优化编译器

### 4. 运行时系统
- **对象系统**: `src/objects/` - JavaScript对象实现
- **内存管理**: `src/heap/` - 垃圾回收和内存分配
- **执行引擎**: `src/execution/` - 函数调用和上下文管理

### 5. 内置功能
- **内置函数**: `src/builtins/` - Array、Object等内置API
- **运行时函数**: `src/runtime/` - 底层运行时支持

## 执行流程

1. **源码输入** → Scanner词法分析
2. **Token流** → Parser语法分析  
3. **AST** → 字节码生成
4. **字节码** → Ignition解释执行
5. **热点代码** → 编译器优化
6. **机器码** → 直接执行

## 优化策略

- **分层编译**: 根据代码热度选择不同编译器
- **内联缓存**: 动态优化属性访问
- **隐藏类**: 优化对象属性布局
- **反优化**: 优化假设失效时的回退机制