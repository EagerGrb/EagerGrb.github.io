# 学习路径

本文档提供V8源码学习的系统化路径和实践建议。

## 学习阶段

### 第一阶段：基础理解 (1-2周)

#### 目标
- 理解V8整体架构
- 掌握基本概念和术语
- 能够编译和运行V8

#### 学习内容
1. **架构概览**
   - 阅读 [架构总览](./01-architecture-overview.md)
   - 理解编译管道：源码 → AST → 字节码 → 机器码
   - 了解各组件职责

2. **环境搭建**
   ```bash
   # 获取depot_tools
   git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
   
   # 获取V8源码
   fetch v8
   cd v8
   
   # 编译V8
   gn gen out/x64.release
   ninja -C out/x64.release d8
   ```

3. **基础实验**
   ```bash
   # 运行简单JavaScript
   ./out/x64.release/d8 -e "console.log('Hello V8')"
   
   # 查看字节码
   ./out/x64.release/d8 --print-bytecode -e "function add(a,b){return a+b;}"
   ```

#### 推荐阅读
- `README.md` - V8项目介绍
- `docs/` - 官方文档
- `include/v8.h` - 主要API接口

### 第二阶段：解析系统 (2-3周)

#### 目标
- 深入理解词法分析和语法分析
- 掌握AST结构和生成过程
- 理解作用域和变量绑定

#### 学习内容
1. **词法分析**
   - 研读 `src/parsing/scanner.cc`
   - 理解Token类型和识别过程
   - 实验：修改关键字识别

2. **语法分析**
   - 研读 `src/parsing/parser.cc`
   - 理解递归下降解析
   - 跟踪简单表达式的解析过程

3. **AST结构**
   - 研读 `src/ast/ast.h`
   - 理解各种AST节点类型
   - 实验：打印AST结构

#### 实践项目
```javascript
// 创建测试文件 test.js
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}

// 分析解析过程
d8 --print-ast test.js
```

### 第三阶段：执行系统 (3-4周)

#### 目标
- 理解字节码生成和执行
- 掌握Ignition解释器工作原理
- 了解运行时系统

#### 学习内容
1. **字节码系统**
   - 阅读 [字节码系统](./03-bytecode-system.md)
   - 研读 `src/interpreter/`
   - 理解字节码指令集

2. **解释执行**
   - 跟踪字节码执行过程
   - 理解寄存器模型
   - 实验：分析函数调用

3. **运行时系统**
   - 研读 `src/runtime/runtime.h`
   - 理解运行时函数调用
   - 学习异常处理机制

#### 实践项目
```bash
# 分析字节码执行
d8 --trace-ignition test.js

# 查看运行时调用
d8 --trace-runtime-calls test.js
```

### 第四阶段：优化编译 (4-6周)

#### 目标
- 理解多层编译架构
- 掌握TurboFan优化原理
- 了解性能优化机制

#### 学习内容
1. **编译器架构**
   - 阅读 [编译优化](./04-compilation-optimization.md)
   - 理解Sparkplug、Maglev、TurboFan的区别
   - 学习编译决策机制

2. **TurboFan深入**
   - 研读 `src/compiler/`
   - 理解Sea of Nodes IR
   - 学习主要优化技术

3. **性能优化**
   - 阅读 [性能优化机制](./06-performance-optimization.md)
   - 理解IC和Hidden Classes
   - 学习反优化机制

#### 实践项目
```bash
# 跟踪优化过程
d8 --trace-opt --trace-deopt test.js

# 使用Turbolizer可视化
d8 --trace-turbo test.js
# 然后用tools/turbolizer/查看
```

### 第五阶段：内存管理 (2-3周)

#### 目标
- 理解V8内存模型
- 掌握垃圾回收算法
- 了解对象系统实现

#### 学习内容
1. **对象系统**
   - 研读 `src/objects/`
   - 理解对象布局和Hidden Classes
   - 学习属性存储机制

2. **内存管理**
   - 研读 `src/heap/`
   - 理解分代垃圾回收
   - 学习内存分配策略

3. **性能调优**
   - 学习内存泄漏检测
   - 理解GC性能影响
   - 掌握内存优化技巧

#### 实践项目
```bash
# 内存分析
d8 --trace-gc --heap-stats test.js

# 堆快照分析
d8 --expose-gc test.js
# 在代码中调用gc()和%TakeHeapSnapshot()
```

### 第六阶段：专项深入 (根据兴趣选择)

#### 选项A：WebAssembly
- 研读 `src/wasm/`
- 理解WASM编译和执行
- 学习WASM与JS互操作

#### 选项B：调试工具
- 研读 `src/debug/`
- 理解调试器实现
- 开发调试工具

#### 选项C：新特性实现
- 跟踪最新ECMAScript特性
- 参与V8开发
- 提交补丁

## 实践建议

### 代码阅读技巧

1. **自顶向下**
   ```
   从API入口开始 → 核心实现 → 底层细节
   ```

2. **跟踪执行流**
   ```bash
   # 使用GDB调试
   gdb ./out/x64.debug/d8
   (gdb) break v8::internal::Parser::ParseProgram
   (gdb) run test.js
   ```

3. **对比学习**
   - 比较不同优化级别的代码
   - 对比相似功能的实现
   - 分析性能差异原因

### 实验环境

#### 调试版本编译
```bash
# 编译调试版本
gn gen out/x64.debug --args='is_debug=true'
ninja -C out/x64.debug d8
```

#### 有用的编译选项
```bash
# 启用断言
--args='dcheck_always_on=true'

# 启用慢速断言
--args='enable_slow_dchecks=true'

# 禁用优化
--args='v8_enable_turbofan=false'
```

### 学习资源

#### 官方资源
- [V8官方博客](https://v8.dev/blog)
- [V8设计文档](https://docs.google.com/document/d/1hOaE7vbwdLLXWj3C8hTnnkpE0qSa2P--dtDvwXXEeD0)
- [V8开发者指南](https://v8.dev/docs/contribute)

#### 社区资源
- [V8源码分析系列](https://github.com/v8/v8/wiki)
- [JavaScript引擎原理](https://mathiasbynens.be/notes/shapes-ics)
- [性能优化指南](https://v8.dev/docs/turbofan)

### 贡献指南

#### 参与开发
1. **阅读贡献指南**
   - `CONTRIBUTING.md`
   - 代码风格指南
   - 测试要求

2. **从小做起**
   - 修复文档错误
   - 添加测试用例
   - 修复小bug

3. **提交流程**
   ```bash
   # 创建分支
   git checkout -b my-feature
   
   # 提交更改
   git commit -m "Add feature X"
   
   # 创建代码审查
   git cl upload
   ```

## 进阶方向

### 研究方向
- **编译器优化**: 新的优化算法
- **内存管理**: 更高效的GC算法
- **并发执行**: 多线程JavaScript
- **安全性**: 沙箱和安全机制

### 职业发展
- **JavaScript引擎开发**
- **编译器工程师**
- **性能优化专家**
- **语言设计师**

## 学习检查点

### 基础阶段检查
- [ ] 能够编译和运行V8
- [ ] 理解V8整体架构
- [ ] 能够查看字节码和优化信息

### 进阶阶段检查
- [ ] 能够跟踪代码执行流程
- [ ] 理解主要优化技术
- [ ] 能够分析性能问题

### 高级阶段检查
- [ ] 能够修改V8源码
- [ ] 理解内存管理细节
- [ ] 能够贡献代码到V8项目