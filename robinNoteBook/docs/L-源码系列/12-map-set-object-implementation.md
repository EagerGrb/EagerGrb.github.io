# Map、Set、Object底层实现与性能分析

## 概述

Map、Set和Object是JavaScript中三种重要的数据结构，它们在V8引擎中有着不同的底层实现和性能特征。

## 1. Object的底层实现

### Hidden Classes (隐藏类)
**位置**: `src/objects/map.h`

```cpp
class Map : public HeapObject {
  // 对象的形状描述
  Tagged<DescriptorArray> instance_descriptors_;  // 属性描述符
  int instance_size_;                             // 实例大小
  ElementsKind elements_kind_;                    // 元素类型
  
  // 属性访问优化
  inline int GetInObjectPropertyOffset(int index) const;
  inline Tagged<Object> RawFastPropertyAt(FieldIndex index) const;
};
```

### 属性存储策略

#### 1. 内联属性 (In-object Properties)
```cpp
class JSObject : public JSReceiver {
  // 直接存储在对象内部的属性
  inline Tagged<Object> InObjectPropertyAt(int index);
  inline Tagged<Object> InObjectPropertyAtPut(int index, Tagged<Object> value);
  
  // 获取内联属性的偏移量
  inline int GetInObjectPropertyOffset(int index);
};
```

#### 2. 外联属性 (Out-of-object Properties)
```cpp
// 当属性过多时，使用属性数组存储
DECL_GETTER(property_array, Tagged<PropertyArray>)

class PropertyArray : public HeapObject {
  // 存储对象的额外属性
  static const int kLengthOffset = HeapObject::kHeaderSize;
  static const int kHashOffset = kLengthOffset + kTaggedSize;
};
```

#### 3. 字典模式 (Dictionary Mode)
```cpp
// 当对象变为"慢对象"时使用字典存储
DECL_GETTER(property_dictionary, Tagged<NameDictionary>)

class NameDictionary : public Dictionary<NameDictionary, NameDictionaryShape> {
  // 哈希表存储属性
  static Handle<NameDictionary> Add(Isolate* isolate,
                                   Handle<NameDictionary> dictionary,
                                   Handle<Name> key,
                                   Handle<Object> value);
};
```

### Object性能特征

#### 优势场景
```javascript
// 1. 固定结构的对象 - 利用Hidden Classes优化
const person = {
  name: "Alice",
  age: 30,
  city: "New York"
};

// 2. 原型链查找 - 内置优化
person.toString(); // 快速原型链查找
```

#### 劣势场景
```javascript
// 1. 频繁添加/删除属性 - 导致Map转换
const obj = {};
for (let i = 0; i < 1000; i++) {
  obj[`key${i}`] = i;  // 可能触发字典模式转换
}

// 2. 非字符串键 - 需要类型转换
obj[1] = "number key";     // 转换为字符串"1"
obj[Symbol.iterator] = function() {}; // Symbol键处理
```

## 2. Map的底层实现

### 核心数据结构
**位置**: `src/objects/ordered-hash-table.h`

```cpp
class OrderedHashMap : public OrderedHashTable<OrderedHashMap, 2> {
  // Map的底层实现基于有序哈希表
  static const int kKeyIndex = 0;
  static const int kValueIndex = 1;
  static const int kEntrySize = 2;
  
  // 查找操作
  InternalIndex FindEntry(Isolate* isolate, Tagged<Object> key);
  
  // 添加操作
  static Handle<OrderedHashMap> Add(Isolate* isolate,
                                   Handle<OrderedHashMap> table,
                                   Handle<Object> key,
                                   Handle<Object> value);
};
```

### 哈希表结构
```cpp
template <class Derived, int entrysize>
class OrderedHashTable : public FixedArray {
  // 哈希桶数组
  static const int kHashTableStartIndex = kPaddingStartIndex + kPaddingSize;
  
  // 数据存储区域
  static const int kDataTableStartIndex(int num_buckets) {
    return kHashTableStartIndex + num_buckets;
  }
  
  // 链表结构处理哈希冲突
  static const int kChainOffset = entrysize;
};
```

### Map的内置方法实现

#### set方法
```cpp
// src/builtins/builtins-collections.cc
BUILTIN(MapPrototypeSet) {
  HandleScope scope(isolate);
  
  // 获取Map对象
  Handle<JSMap> map = Handle<JSMap>::cast(args.receiver());
  Handle<Object> key = args.atOrUndefined(isolate, 1);
  Handle<Object> value = args.atOrUndefined(isolate, 2);
  
  // 添加键值对
  Handle<OrderedHashMap> table(OrderedHashMap::cast(map->table()), isolate);
  Handle<OrderedHashMap> new_table = 
      OrderedHashMap::Add(isolate, table, key, value);
  map->set_table(*new_table);
  
  return *map;  // 返回Map对象本身，支持链式调用
}
```

#### get方法
```cpp
BUILTIN(MapPrototypeGet) {
  HandleScope scope(isolate);
  
  Handle<JSMap> map = Handle<JSMap>::cast(args.receiver());
  Handle<Object> key = args.atOrUndefined(isolate, 1);
  
  Handle<OrderedHashMap> table(OrderedHashMap::cast(map->table()), isolate);
  InternalIndex entry = table->FindEntry(isolate, *key);
  
  if (entry.is_found()) {
    return table->ValueAt(entry);
  }
  return ReadOnlyRoots(isolate).undefined_value();
}
```

### Map性能特征

#### 优势场景
```javascript
// 1. 任意类型的键
const map = new Map();
map.set(1, "number key");
map.set("1", "string key");
map.set({}, "object key");
map.set(Symbol(), "symbol key");

// 2. 频繁的增删操作
for (let i = 0; i < 10000; i++) {
  map.set(i, i * 2);
}
map.delete(5000); // O(1)删除

// 3. 保持插入顺序
for (let [key, value] of map) {
  console.log(key, value); // 按插入顺序遍历
}
```

## 3. Set的底层实现

### 核心数据结构
```cpp
class OrderedHashSet : public OrderedHashTable<OrderedHashSet, 1> {
  // Set只存储键，没有值
  static const int kKeyIndex = 0;
  static const int kEntrySize = 1;
  
  // 添加元素
  static Handle<OrderedHashSet> Add(Isolate* isolate,
                                   Handle<OrderedHashSet> table,
                                   Handle<Object> key);
                                   
  // 删除元素
  static bool Delete(Isolate* isolate,
                    Handle<OrderedHashSet> table,
                    Handle<Object> key);
};
```

### Set的内置方法实现

#### add方法
```cpp
BUILTIN(SetPrototypeAdd) {
  HandleScope scope(isolate);
  
  Handle<JSSet> set = Handle<JSSet>::cast(args.receiver());
  Handle<Object> value = args.atOrUndefined(isolate, 1);
  
  Handle<OrderedHashSet> table(OrderedHashSet::cast(set->table()), isolate);
  Handle<OrderedHashSet> new_table = 
      OrderedHashSet::Add(isolate, table, value);
  set->set_table(*new_table);
  
  return *set;  // 返回Set对象本身
}
```

#### has方法
```cpp
BUILTIN(SetPrototypeHas) {
  HandleScope scope(isolate);
  
  Handle<JSSet> set = Handle<JSSet>::cast(args.receiver());
  Handle<Object> key = args.atOrUndefined(isolate, 1);
  
  Handle<OrderedHashSet> table(OrderedHashSet::cast(set->table()), isolate);
  InternalIndex entry = table->FindEntry(isolate, *key);
  
  return isolate->heap()->ToBoolean(entry.is_found());
}
```

## 4. 性能对比分析

### 内存使用对比

#### Object内存布局
```cpp
// 小对象：内联属性存储
JSObject: [Map][Properties][Element][InlineProperty1][InlineProperty2]...

// 大对象：外联属性存储  
JSObject: [Map][PropertyArray*][Element]
PropertyArray: [Length][Hash][Property1][Property2]...

// 字典模式对象
JSObject: [Map][NameDictionary*][Element]
NameDictionary: [HashTable with key-value pairs]
```

#### Map/Set内存布局
```cpp
// Map对象
JSMap: [Map][OrderedHashMap*]
OrderedHashMap: [Length][Buckets...][Data: key1,value1,next1,key2,value2,next2...]

// Set对象
JSSet: [Map][OrderedHashSet*]  
OrderedHashSet: [Length][Buckets...][Data: key1,next1,key2,next2...]
```

### 操作复杂度对比

| 操作 | Object | Map | Set |
|------|--------|-----|-----|
| 添加属性/元素 | O(1)* | O(1) | O(1) |
| 查找属性/元素 | O(1)* | O(1) | O(1) |
| 删除属性/元素 | O(n)** | O(1) | O(1) |
| 遍历 | O(n) | O(n) | O(n) |
| 获取大小 | O(n)*** | O(1) | O(1) |

*: 在快速模式下，字典模式可能退化
**: delete操作可能触发属性重排
***: 需要Object.keys().length

### 基准测试代码

#### 插入性能测试
```javascript
// Object插入
console.time('Object insert');
const obj = {};
for (let i = 0; i < 100000; i++) {
  obj[i] = i;
}
console.timeEnd('Object insert');

// Map插入
console.time('Map insert');
const map = new Map();
for (let i = 0; i < 100000; i++) {
  map.set(i, i);
}
console.timeEnd('Map insert');

// Set插入
console.time('Set insert');
const set = new Set();
for (let i = 0; i < 100000; i++) {
  set.add(i);
}
console.timeEnd('Set insert');
```

#### 查找性能测试
```javascript
// 随机查找测试
const keys = Array.from({length: 10000}, () => Math.floor(Math.random() * 100000));

console.time('Object lookup');
keys.forEach(key => obj[key]);
console.timeEnd('Object lookup');

console.time('Map lookup');
keys.forEach(key => map.get(key));
console.timeEnd('Map lookup');

console.time('Set lookup');
keys.forEach(key => set.has(key));
console.timeEnd('Set lookup');
```

## 5. 最佳使用场景

### Object适用场景
```javascript
// 1. 记录/配置对象 - 固定结构
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

// 2. 原型链和继承
class User {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return `Hello, ${this.name}`;
  }
}

// 3. JSON序列化
const data = { id: 1, name: 'Alice' };
JSON.stringify(data); // Object天然支持
```

### Map适用场景
```javascript
// 1. 任意类型键的映射
const cache = new Map();
cache.set(userObject, userData);
cache.set(42, "number key");
cache.set("42", "string key");

// 2. 频繁增删的键值对
const sessionStore = new Map();
sessionStore.set(sessionId, sessionData);
sessionStore.delete(expiredSessionId);

// 3. 需要保持插入顺序
const orderedMap = new Map([
  ['first', 1],
  ['second', 2],
  ['third', 3]
]);

// 4. 需要准确的大小信息
console.log(orderedMap.size); // 3，O(1)操作
```

### Set适用场景
```javascript
// 1. 去重操作
const uniqueValues = new Set([1, 2, 2, 3, 3, 4]);
console.log([...uniqueValues]); // [1, 2, 3, 4]

// 2. 成员检查
const allowedUsers = new Set(['admin', 'user1', 'user2']);
if (allowedUsers.has(currentUser)) {
  // 允许访问
}

// 3. 集合运算
const setA = new Set([1, 2, 3]);
const setB = new Set([3, 4, 5]);

// 交集
const intersection = new Set([...setA].filter(x => setB.has(x)));

// 并集  
const union = new Set([...setA, ...setB]);

// 差集
const difference = new Set([...setA].filter(x => !setB.has(x)));
```

## 6. 性能优化建议

### Object优化
```javascript
// 1. 保持对象形状稳定
const createUser = (name, age) => ({ name, age }); // 好
// 避免：const user = {}; user.name = name; user.age = age;

// 2. 避免delete操作
const user = { name: 'Alice', temp: 'value' };
user.temp = undefined; // 好于 delete user.temp;

// 3. 预分配属性
class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    // 预分配所有可能的属性
  }
}
```

### Map/Set优化
```javascript
// 1. 预设容量（如果已知大小）
const map = new Map(); // V8会根据使用情况自动调整

// 2. 批量操作
const entries = [[key1, value1], [key2, value2]];
const map = new Map(entries); // 比逐个set更高效

// 3. 合理选择数据结构
// 如果键都是字符串且结构相对固定，考虑使用Object
// 如果需要任意类型键或频繁增删，使用Map
```

## 7. 调试和分析

### V8调试工具
```bash
# 查看对象的Hidden Class
d8 --allow-natives-syntax -e "
const obj = {a: 1, b: 2};
%DebugPrint(obj);
%HaveSameMap(obj, {a: 3, b: 4});
"

# 查看Map/Set的内部结构
d8 --allow-natives-syntax -e "
const map = new Map([['a', 1], ['b', 2]]);
%DebugPrint(map);
"
```

### 性能分析
```javascript
// 使用Performance API测量
performance.mark('start');
// 执行操作
performance.mark('end');
performance.measure('operation', 'start', 'end');
console.log(performance.getEntriesByName('operation')[0].duration);
```

通过理解这些底层实现差异，开发者可以根据具体场景选择最适合的数据结构，从而获得最佳性能。