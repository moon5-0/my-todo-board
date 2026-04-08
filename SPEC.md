# 待办事项看板 - 开发规范

> 版本：v1.0
> 日期：2026-04-08
> 状态：草稿

---

## 一、项目概述

### 1.1 项目目标

构建一个单页面的待办事项看板网页应用，采用看板（Kanban）形式展示任务，支持任务的增删改查、状态切换，并使用浏览器 localStorage 实现数据持久化。

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 结构 | HTML5 | 语义化标签 |
| 样式 | CSS3 + CSS Variables | 原生 CSS，支持深色模式 |
| 逻辑 | Vanilla JavaScript (ES6+) | 无框架依赖 |
| 存储 | localStorage | 浏览器本地持久化 |
| 构建 | 单文件 / 模块化 | 可直接打开或模块引入 |

### 1.3 文件结构

```
my-todo-board/
├── index.html          # 主页面
├── styles/
│   └── main.css        # 样式文件
├── scripts/
│   ├── app.js          # 应用入口
│   ├── store.js        # 状态管理与 localStorage
│   ├── kanban.js       # 看板视图渲染
│   └── components/
│       ├── TaskCard.js     # 任务卡片组件
│       ├── TaskInput.js    # 任务输入组件
│       └── ConfirmModal.js # 确认弹窗组件
├── assets/
│   └── icons/          # SVG 图标
└── SPEC.md             # 本文档
```

---

## 二、页面布局

### 2.1 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│  Header: Logo + 标题 + 深色模式切换 + 添加任务按钮            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   待办列表   │  │  进行中列表  │  │  已完成列表  │          │
│  │  (Backlog)  │  │ (In Progress)│  │  (Done)     │          │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤          │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │          │
│  │ │ Task 1  │ │  │ │ Task 3  │ │  │ │ Task 5  │ │          │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │          │
│  │ ┌─────────┐ │  │             │  │ ┌─────────┐ │          │
│  │ │ Task 2  │ │  │             │  │ │ Task 6  │ │          │
│  │ └─────────┘ │  │             │  │ └─────────┘ │          │
│  │             │  │             │  │             │          │
│  │ + 添加任务   │  │ + 添加任务   │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 响应式策略

| 断点 | 布局行为 |
|------|----------|
| >= 1024px | 三列并排显示 |
| 768px ~ 1023px | 三列但更窄，任务卡片简化 |
| < 768px | 水平滚动，每列可滑动切换 |

### 2.3 视觉规范

#### 颜色系统

```css
:root {
  /* 主色 */
  --color-primary: #3B82F6;        /* 蓝色 - 主要按钮/强调 */
  --color-primary-hover: #2563EB;

  /* 列表标签色 */
  --color-tag-backlog: #64748B;     /* 灰色 */
  --color-tag-progress: #F59E0B;    /* 橙色 */
  --color-tag-done: #10B981;       /* 绿色 */

  /* 状态色 */
  --color-success: #10B981;
  --color-danger: #EF4444;
  --color-warning: #F59E0B;

  /* 背景色 */
  --bg-primary: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-header: #FFFFFF;

  /* 文字色 */
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;

  /* 边框 */
  --border-color: #E2E8F0;
  --border-radius: 8px;

  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

/* 深色模式 */
[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-card: #1E293B;
  --bg-header: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border-color: #334155;
}
```

#### 字体规范

```css
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.5rem;    /* 24px */
```

#### 间距规范

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
```

---

## 三、数据结构

### 3.1 数据模型

```javascript
// 应用状态
const appState = {
  lists: [],     // 列表数组
  tasks: {},      // 任务对象，key 为任务 ID
  theme: 'light'  // 'light' | 'dark'
};

// 列表结构
const listSchema = {
  id: String,           // 唯一标识，例: "list-1"
  name: String,         // 列表名称，例: "待办"
  nameEn: String,       // 英文标识，例: "backlog"
  taskIds: [],          // 任务 ID 数组（保持顺序）
  color: String         // 列表颜色变量名
};

// 任务结构
const taskSchema = {
  id: String,           // 唯一标识，例: "task-1"
  title: String,        // 任务标题
  completed: Boolean,   // 是否完成
  listId: String,       // 所属列表 ID
  createdAt: Number,    // 创建时间戳
  updatedAt: Number     // 更新时间戳
};
```

### 3.2 默认数据

```javascript
const defaultData = {
  lists: [
    { id: 'list-backlog', name: '待办', nameEn: 'backlog', taskIds: [], color: 'var(--color-tag-backlog)' },
    { id: 'list-progress', name: '进行中', nameEn: 'in-progress', taskIds: [], color: 'var(--color-tag-progress)' },
    { id: 'list-done', name: '已完成', nameEn: 'done', taskIds: [], color: 'var(--color-tag-done)' }
  ],
  tasks: {}
};
```

### 3.3 localStorage 存储

```
Key: "todo-board-data"
Value: JSON.stringify(appState)
```

---

## 四、主要函数

### 4.1 store.js - 状态管理模块

```javascript
/**
 * 初始化 Store
 * 从 localStorage 加载数据或使用默认数据
 */
function initStore()

/**
 * 获取完整状态
 * @returns {Object} 当前应用状态
 */
function getState()

/**
 * 保存状态到 localStorage
 */
function saveState()

/**
 * 添加任务
 * @param {string} title - 任务标题
 * @param {string} listId - 目标列表 ID
 * @returns {Object} 新创建的任务对象
 */
function addTask(title, listId)

/**
 * 删除任务
 * @param {string} taskId - 任务 ID
 */
function deleteTask(taskId)

/**
 * 更新任务
 * @param {string} taskId - 任务 ID
 * @param {Object} updates - 更新字段 { title?, completed? }
 */
function updateTask(taskId, updates)

/**
 * 移动任务到指定列表
 * @param {string} taskId - 任务 ID
 * @param {string} toListId - 目标列表 ID
 */
function moveTask(taskId, toListId)

/**
 * 切换主题
 */
function toggleTheme()
```

### 4.2 kanban.js - 看板视图模块

```javascript
/**
 * 渲染整个看板
 */
function renderBoard()

/**
 * 渲染单个列表
 * @param {Object} list - 列表数据
 * @returns {string} HTML 字符串
 */
function renderList(list)

/**
 * 渲染任务卡片
 * @param {Object} task - 任务数据
 * @returns {string} HTML 字符串
 */
function renderTaskCard(task)

/**
 * 绑定看板事件委托
 */
function bindBoardEvents()
```

### 4.3 事件处理

| 事件 | 处理器 | 行为 |
|------|--------|------|
| 点击「添加任务」按钮 | `handleAddClick` | 显示输入框 |
| 提交新任务 | `handleTaskSubmit` | 调用 `store.addTask()`，重新渲染 |
| 点击删除按钮 | `handleDeleteClick` | 显示确认弹窗 |
| 确认删除 | `handleDeleteConfirm` | 调用 `store.deleteTask()`，重新渲染 |
| 点击编辑按钮 | `handleEditClick` | 进入编辑模式 |
| 提交编辑 | `handleEditSubmit` | 调用 `store.updateTask()`，重新渲染 |
| 点击复选框 | `handleToggleComplete` | 调用 `store.updateTask()`，重新渲染 |
| 点击深色模式切换 | `handleThemeToggle` | 调用 `store.toggleTheme()`，更新 DOM |

---

## 五、组件规范

### 5.1 TaskCard 任务卡片

```html
<article class="task-card" data-task-id="${task.id}">
  <div class="task-card__checkbox ${task.completed ? 'is-checked' : ''}">
    <svg><!-- 勾选图标 --></svg>
  </div>
  <div class="task-card__content ${task.completed ? 'is-completed' : ''}">
    <span class="task-card__title">${task.title}</span>
  </div>
  <div class="task-card__actions">
    <button class="btn-icon btn-edit" title="编辑">
      <svg><!-- 编辑图标 --></svg>
    </button>
    <button class="btn-icon btn-delete" title="删除">
      <svg><!-- 删除图标 --></svg>
    </button>
  </div>
</article>
```

**状态**：
- 默认：白色背景，浅灰边框
- 悬停：显示操作按钮，轻微阴影
- 已完成：标题删除线，灰色文字
- 编辑中：标题变为输入框

### 5.2 TaskInput 输入组件

```html
<div class="task-input-wrapper">
  <input
    type="text"
    class="task-input"
    placeholder="输入任务标题..."
    maxlength="100"
  />
  <select class="task-list-select">
    <option value="list-backlog">待办</option>
    <option value="list-progress">进行中</option>
    <option value="list-done">已完成</option>
  </select>
  <button class="btn btn-primary btn-add">添加</button>
  <button class="btn btn-ghost btn-cancel">取消</button>
</div>
```

### 5.3 ConfirmModal 确认弹窗

```html
<div class="modal-overlay">
  <div class="modal">
    <h3 class="modal__title">确认删除</h3>
    <p class="modal__message">确定要删除这个任务吗？此操作无法撤销。</p>
    <div class="modal__actions">
      <button class="btn btn-ghost btn-cancel">取消</button>
      <button class="btn btn-danger btn-confirm">删除</button>
    </div>
  </div>
</div>
```

---

## 六、与 AI 协作开发指南

### 6.1 推荐的 AI 提示词模板

#### 创建新功能
```
我想在当前项目中添加 [功能名称]，需求如下：
- 功能描述：...
- 用户交互：...
- 数据变化：...

请按照 SPEC.md 的规范，生成相应的代码。
```

#### 修复 Bug
```
我遇到了以下问题：[描述问题]
- 复现步骤：...
- 预期行为：...
- 实际行为：...

请帮我定位问题并修复。
```

#### 代码审查
```
请检查 [文件名/模块名] 的代码是否符合 SPEC.md 规范，
重点关注：功能完整性、代码质量、安全性。
```

### 6.2 AI 辅助开发流程

```
┌─────────────┐
│  需求分析    │  用户提出想法
└──────┬──────┘
       ▼
┌─────────────┐
│  编写 SPEC  │  AI 协助整理规范
└──────┬──────┘
       ▼
┌─────────────┐
│  代码生成    │  AI 根据 SPEC 生成代码
└──────┬──────┘
       ▼
┌─────────────┐
│  代码审查    │  AI 或人工检查
└──────┬──────┘
       ▼
┌─────────────┐
│  测试验证    │  浏览器测试
└──────┬──────┘
       ▼
┌─────────────┐
│  持续迭代    │  根据反馈优化
└─────────────┘
```

### 6.3 保持 AI 上下文的方法

1. **提供完整上下文**：每次对话时，可简要说明「我们正在开发一个待办事项看板」
2. **引用 SPEC.md**：告诉 AI「请参考 SPEC.md 第 X 节」
3. **分享相关代码**：提供问题代码片段，而非仅描述问题
4. **分步骤进行**：先实现核心功能，再逐步添加细节

---

## 七、开发检查清单

### 7.1 功能检查

- [ ] 可以添加新任务到指定列表
- [ ] 可以删除任务（有确认）
- [ ] 可以编辑任务标题
- [ ] 可以标记任务完成/未完成
- [ ] 完成任务不会自动移动列表（可选）
- [ ] 数据刷新后仍然保留
- [ ] 深色模式切换正常

### 7.2 交互检查

- [ ] 添加任务后输入框清空
- [ ] 删除确认弹窗可取消
- [ ] 编辑时按 Esc 取消
- [ ] 空任务不能提交
- [ ] 输入框获得焦点时有视觉反馈

### 7.3 性能检查

- [ ] 100+ 任务时渲染正常
- [ ] 动画流畅（60fps）
- [ ] localStorage 操作无阻塞

---

## 八、后续可扩展功能

> 以下为可选功能，不影响当前版本交付

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 拖拽排序 | 任务可在列表内/间拖拽排序 | P2 |
| 标签系统 | 给任务添加彩色标签 | P3 |
| 搜索过滤 | 按标题搜索任务 | P3 |
| 数据导出 | 导出 JSON 备份 | P3 |
| 快捷键 | 键盘快捷操作 | P4 |

---

*本规范由 AI 协助编写，可根据实际开发情况迭代更新。*
