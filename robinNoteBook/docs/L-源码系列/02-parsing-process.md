# 源码解析流程

## 词法分析 (Lexical Analysis)

### Scanner组件
**位置**: `src/parsing/scanner.cc`

#### 主要功能
- 将字符流转换为Token流
- 识别关键字、标识符、字面量
- 处理注释和空白字符

#### 关键类
```cpp
class Scanner {
  Token::Value Next();           // 获取下一个Token
  Token::Value current_token();  // 当前Token
  Location location();           // Token位置信息
};
```

#### Token类型
- **关键字**: `if`, `for`, `function`等
- **标识符**: 变量名、函数名
- **字面量**: 数字、字符串、布尔值
- **操作符**: `+`, `-`, `==`, `===`等
- **分隔符**: `(`, `)`, `{`, `}`等

## 语法分析 (Syntax Analysis)

### Parser组件
**位置**: `src/parsing/parser.cc`

#### 解析策略
- **递归下降解析**: 每个语法规则对应一个解析函数
- **预测解析**: 根据当前Token预测语法结构
- **错误恢复**: 语法错误时的恢复机制

#### 核心解析函数
```cpp
class Parser {
  FunctionLiteral* ParseProgram();           // 解析程序
  Statement* ParseStatement();               // 解析语句
  Expression* ParseExpression();             // 解析表达式
  FunctionLiteral* ParseFunctionLiteral();   // 解析函数
};
```

#### 语法结构
- **声明**: 变量声明、函数声明、类声明
- **语句**: 表达式语句、控制流语句
- **表达式**: 二元表达式、调用表达式、成员表达式

## 抽象语法树 (AST)

### AST节点类型
**位置**: `src/ast/ast.h`

#### 基础节点
```cpp
class AstNode {
  enum NodeType {
    kExpression,
    kStatement,
    kDeclaration
  };
};
```

#### 表达式节点
- **Literal**: 字面量 (`42`, `"hello"`)
- **Identifier**: 标识符 (`variable`)
- **BinaryOperation**: 二元操作 (`a + b`)
- **CallExpression**: 函数调用 (`func()`)
- **MemberExpression**: 成员访问 (`obj.prop`)

#### 语句节点
- **ExpressionStatement**: 表达式语句
- **IfStatement**: 条件语句
- **ForStatement**: 循环语句
- **ReturnStatement**: 返回语句

#### 声明节点
- **VariableDeclaration**: 变量声明
- **FunctionDeclaration**: 函数声明
- **ClassDeclaration**: 类声明

## 作用域分析

### 作用域链构建
**位置**: `src/ast/scopes.cc`

#### Scope类型
- **GlobalScope**: 全局作用域
- **FunctionScope**: 函数作用域
- **BlockScope**: 块级作用域
- **ModuleScope**: 模块作用域

#### 变量绑定
```cpp
class Scope {
  Variable* DeclareVariable(const AstRawString* name);
  Variable* LookupLocal(const AstRawString* name);
  Scope* outer_scope();  // 外层作用域
};
```

## 语义分析

### 类型检查
- 变量声明检查
- 函数参数匹配
- 作用域规则验证

### 优化预处理
- **常量折叠**: `1 + 2` → `3`
- **死代码消除**: 移除不可达代码
- **变量提升**: `var`和`function`声明提升

## 错误处理

### 语法错误
- 位置信息记录
- 错误消息生成
- 错误恢复策略

### 语义错误
- 未声明变量使用
- 重复声明检查
- 严格模式违规