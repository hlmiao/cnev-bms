# CSV数据转换器

CSV数据转换器是电池能源管理平台的核心组件，负责将项目1和项目2的原始CSV数据转换为标准化的JSON格式，并提供Web界面进行可视化展示。

## 功能特性

- **多项目支持**: 支持项目1（2#、14#、15#系统）和项目2（group1-4分组）数据转换
- **实时监控**: 支持文件系统变化监控和增量处理
- **数据验证**: 提供完整的数据质量检查和异常检测
- **高性能**: 采用流式处理和并行处理优化大文件转换
- **类型安全**: 使用TypeScript提供完整的类型定义

## 项目结构

```
csv-converter/
├── src/
│   ├── types/           # 类型定义
│   ├── interfaces/      # 接口定义
│   ├── utils/          # 工具函数
│   ├── scanners/       # 文件扫描器（待实现）
│   ├── parsers/        # CSV解析器（待实现）
│   ├── transformers/   # 数据转换器（待实现）
│   ├── validators/     # 数据验证器（待实现）
│   └── index.ts        # 主入口文件
├── tests/              # 测试文件（待实现）
├── dist/               # 编译输出目录
├── logs/               # 日志文件目录
└── data/               # 数据输出目录
    ├── converted/      # 转换后的数据
    ├── indexes/        # 索引文件
    └── reports/        # 转换报告
```

## 安装和使用

### 安装依赖

```bash
cd csv-converter
npm install
```

### 编译项目

```bash
npm run build
```

### 运行测试

```bash
npm test
```

### 开发模式

```bash
npm run dev
```

## 数据格式

### 项目1数据格式
- 系统编号: 2#、14#、15#
- Bank编号: Bank01-Bank11
- 数据字段: 电压(V1-V400)、温度(T1-T400)、SOC(SOC1-SOC400)、SOH(SOH1-SOH400)

### 项目2数据格式
- 组编号: group1-group4
- 数据类型: soc、state、temperature、voltage
- 电芯数量: 216个电芯(vol1-vol216)

## 配置

转换器使用 `src/utils/constants.ts` 中的默认配置，支持以下配置项：

- 编码格式
- 时间格式
- 电芯数量
- 数据验证范围
- 输出格式

## 开发状态

当前项目处于初始化阶段，已完成：
- ✅ 项目结构搭建
- ✅ TypeScript配置
- ✅ 类型定义
- ✅ 接口定义
- ✅ 基础工具函数

待实现功能：
- 🔄 文件扫描器
- 🔄 CSV解析器
- 🔄 数据转换器
- 🔄 数据验证器
- 🔄 CLI接口
- 🔄 测试用例

## 许可证

MIT License