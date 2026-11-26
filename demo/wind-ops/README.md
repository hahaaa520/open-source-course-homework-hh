# 风电巡检与运维协同 Demo

公开访问：<https://vyys3x3odee6k.ok.kimi.link>

这是“风电巡检与运维协同”课程项目的最新静态交互演示，使用 React、TypeScript 和 Vite。页面展示业务工作台、RAG 检索、Wiki 与知识图谱、Harness 场景运行、人工复核和权限管理。

## 边界

- 全部数据均为合成课程内容，不对应真实客户或设备。
- 没有 FastAPI 生产后端，不连接真实 SCADA、EAM、模型服务或客户数据库。
- RAG、Harness、权限检查和运行结果均为浏览器内的确定性模拟，不代表真实模型质量或生产验收。
- 新增复核任务、运行记录和身份修改只保存到当前浏览器的 `localStorage`，不会跨设备同步。
- 不提供设备控制、正式工单写入或自动外发能力。

## 本地运行

建议使用 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

开发服务器默认端口为 3000；可通过 `-- --port 7100` 指定其他端口。

## 构建与检查

```bash
npm run lint
npm run build
npm run preview
```

## 主要文件

```text
wind-ops/
├── public/favicon.svg
├── src/
│   ├── App.tsx          # 页面、交互、人工复核与权限演示
│   ├── App.css          # 响应式样式
│   ├── demoData.ts      # 合成数据与类型
│   ├── index.css        # 全局基础样式
│   └── main.tsx         # React 入口
├── index.html
├── package.json
└── vite.config.ts
```

完整设计约束见 `../../docs/风电巡检与运维协同-技术方案.md`，训练核验范围见 `../../docs/风电巡检与运维协同-训练成果与核验记录.md`。
