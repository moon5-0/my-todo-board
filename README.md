# 待办事项看板

> 我的第一个 Vibe Coding 学习项目 —— 从零开始，用 AI 辅助逐步构建的待办看板应用。

## 项目概述

一个简洁的待办事项看板，支持：

- **增删改查** — 添加、删除、编辑任务，实时保存
- **三栏看板** — 待办 / 进行中 / 已完成
- **任务完成标记** — 点击复选框切换状态
- **数据持久化** — 所有数据自动保存到浏览器 localStorage
- **明暗主题切换** — 一键换肤，跟随系统偏好

## 设计参考

项目中引入了 Notion 官方设计系统作为视觉参考，源文件来自 [awesome-design-md](https://github.com/JingYj001/awesome-design-md) 仓库，详见 [notion/DESIGN.md](notion/DESIGN.md)。

Notion 设计哲学核心要点：

- **暖中性色调** — 非冷灰，而是带黄褐底色的暖灰色（#f6f5f4、#31302e），营造纸张般温润质感
- **极细边框** — `1px solid rgba(0,0,0,0.1)`，如耳语般若有若无的分隔线
- **多层阴影** — 4~5 层极低透明度阴影叠加（单层不超 0.05），产生"嵌入页面"而非"浮于表面"的深度感
- **Notion Blue**（#0075de）— 唯一饱和色，仅用于 CTA 和交互元素
- **圆润药丸徽章** — 9999px radius 的状态标签

## 技术栈

| 层级 | 技术 |
|------|------|
| 结构 | HTML5（语义化标签） |
| 样式 | CSS3（CSS Variables、Flexbox、Grid） |
| 交互 | Vanilla JavaScript（ES6+） |
| 持久化 | localStorage |
| 设计 | Notion 风格（暖白配色 + 多层阴影） |
| 字体 | Inter（Google Fonts） |

无框架、无构建工具、直接浏览器打开即可运行。

## 文件结构

```
my-todo-board/
├── index.html            # 页面入口
├── notion/
│   └── DESIGN.md         # Notion 官方设计系统参考文档
├── styles/
│   └── main.css          # 所有样式（Notion 设计系统）
└── scripts/
    ├── icons.js          # SVG 图标常量
    ├── utils.js          # 工具函数（HTML 转义等）
    ├── store.js          # 状态管理 + localStorage 持久化
    ├── kanban.js         # 看板渲染器
    └── app.js            # 应用控制器（UI 逻辑）
```

## 快速开始

直接用浏览器打开 `index.html` 即可：

```bash
open index.html
```

## 项目笔记

这是我在学习开发过程中的第一个完整项目。系统的走了一遍流程
第一步：需求定义与规划
第二步：规范设计（Spec）
第三步：原型与代码生成
第四步：迭代与测试
第五步：审查与优化
第六步：部署与运维

因为是学习流程的项目，没有想着把功能完善，所以用起来的体验一般。

## License

MIT