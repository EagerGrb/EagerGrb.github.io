# V8 JavaScript引擎源码学习指南

本目录包含V8引擎源码分析的详细文档，帮助理解JavaScript底层实现原理。

## 文档结构

- [V8架构总览](./01-architecture-overview.md) - V8引擎整体架构
- [源码解析流程](./02-parsing-process.md) - 词法分析和语法分析
- [字节码系统](./03-bytecode-system.md) - Ignition解释器
- [编译优化](./04-compilation-optimization.md) - 多层编译器
- [运行时系统](./05-runtime-system.md) - 对象系统和内存管理
- [性能优化机制](./06-performance-optimization.md) - IC和Hidden Classes
- [内置功能](./07-builtin-features.md) - 内置函数和API
- [调试分析工具](./08-debugging-tools.md) - 调试和性能分析
- [学习路径](./09-learning-path.md) - 学习建议和实践指南

## 快速开始

建议按照以下顺序阅读：
1. 架构总览 → 了解整体结构
2. 源码解析流程 → 理解代码如何变成AST
3. 字节码系统 → 掌握执行机制
4. 其他模块 → 根据兴趣深入学习

## 源码目录对应关系

| 功能模块 | 源码目录 | 文档章节 |
|---------|---------|---------|
| 词法语法分析 | `src/parsing/` | 02章 |
| 字节码解释器 | `src/interpreter/` | 03章 |
| 优化编译器 | `src/compiler/` | 04章 |
| 对象系统 | `src/objects/` | 05章 |
| 内存管理 | `src/heap/` | 05章 |
| 内置函数 | `src/builtins/` | 07章 |

C:\Users\Administrator\AppData\Local\winToolBox\Tools