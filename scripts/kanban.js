/**
 * ==================== Kanban（看板渲染器） ====================
 * 负责根据 Store 中的状态渲染 HTML 结构，
 * 并将用户交互事件委托（delegate）给 App 处理
 */

/** 看板最外层容器 */
const Kanban = {
  boardEl: document.getElementById('board'),

  /**
   * 完整重新渲染整个看板
   * 调用时机：任何数据变更（增删改）后都需要调用一次
   */
  render() {
    const state = Store.getState();

    // 1. 渲染所有列表的 HTML 结构
    this.boardEl.innerHTML = state.lists.map(list => this.renderList(list)).join('');

    // 2. 为空列表补充空状态提示（无任务时显示占位符）
    state.lists.forEach(list => {
      const tasksEl = document.querySelector(`[data-list-id="${list.id}"] .list__tasks`);
      if (tasksEl && list.taskIds.length === 0) {
        tasksEl.innerHTML = `
          <div class="empty-state">
            ${Icons.clipboard}
            <p>暂无任务</p>
          </div>
        `;
      }
    });
  },

  /**
   * 渲染单个列表（列）
   * @param {Object} list - 列表对象 { id, name, taskIds[], color }
   * @returns {string} HTML 字符串
   */
  renderList(list) {
    const state = Store.getState();
    // 通过 taskIds 数组按顺序取出任务对象，过滤已删除的任务
    const tasks = list.taskIds.map(id => state.tasks[id]).filter(Boolean);

    return `
      <section class="list" data-list-id="${list.id}">
        <header class="list__header">
          <span class="list__tag" style="background-color: ${list.color}"></span>
          <span class="list__name">${list.name}</span>
          <span class="list__count">${tasks.length}</span>
        </header>
        <div class="list__tasks">
          ${tasks.map(task => this.renderTaskCard(task)).join('')}
        </div>
        <footer class="list__add-task">
          <button class="btn btn-ghost list__add-btn" data-action="add-to-list" data-list-id="${list.id}">
            ${Icons.plus}
            添加任务
          </button>
        </footer>
      </section>
    `;
  },

  /**
   * 渲染单个任务卡片
   * @param {Object} task - 任务对象 { id, title, completed }
   * @returns {string} HTML 字符串
   */
  renderTaskCard(task) {
    return `
      <article class="task-card ${task.completed ? 'is-completed' : ''}" data-task-id="${task.id}">
        <div class="task-card__checkbox ${task.completed ? 'is-checked' : ''}"
             data-action="toggle-complete"
             data-task-id="${task.id}">
          ${Icons.check}
        </div>
        <div class="task-card__content ${task.completed ? 'is-completed' : ''}"
             data-task-content="${task.id}">
          <span class="task-card__title">${Utils.escapeHtml(task.title)}</span>
        </div>
        <div class="task-card__actions">
          <button class="btn-icon btn-edit"
                  data-action="edit-task"
                  data-task-id="${task.id}"
                  title="编辑">
            ${Icons.edit}
          </button>
          <button class="btn-icon btn-delete"
                  data-action="delete-task"
                  data-task-id="${task.id}"
                  title="删除">
            ${Icons.trash}
          </button>
        </div>
      </article>
    `;
  },

  /**
   * 绑定看板内所有用户交互事件
   * 使用事件委托模式，在 boardEl 顶层监听 click 和 keydown，
   * 再根据 data-action / class 识别具体操作
   */
  bindEvents() {
    // -------- click 事件（操作按钮） --------
    this.boardEl.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;

      const actionType = action.dataset.action;
      const taskId = action.dataset.taskId;
      const listId = action.dataset.listId;

      switch (actionType) {
        case 'add-to-list':
          App.showAddInput(listId);         // 在指定列表下方显示输入框
          break;
        case 'toggle-complete':
          App.handleToggleComplete(taskId);  // 切换任务完成状态
          break;
        case 'edit-task':
          App.handleEditStart(taskId);       // 开始编辑任务
          break;
        case 'delete-task':
          App.handleDeleteClick(taskId);     // 显示删除确认弹窗
          break;
      }
    });

    // -------- keydown 事件（内联输入框） --------
    this.boardEl.addEventListener('keydown', (e) => {
      if (!e.target.classList.contains('task-input')) return;

      const listId = e.target.dataset.listId;

      if (e.key === 'Enter') {
        // 回车提交新任务
        e.preventDefault();
        App.handleTaskSubmit(e.target.value, listId);
      }
      if (e.key === 'Escape') {
        // ESC 取消输入，隐藏输入框
        e.preventDefault();
        App.hideAllInputs();
      }
    });

    // -------- click 事件（内联输入框的按钮） --------
    this.boardEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add-inline')) {
        // 点击内联"添加"按钮
        const input = e.target.closest('.task-input-wrapper').querySelector('.task-input');
        const listId = input.dataset.listId;
        App.handleTaskSubmit(input.value, listId);
      }
      if (e.target.classList.contains('btn-cancel-inline')) {
        // 点击内联"取消"按钮
        App.hideAllInputs();
      }
    });
  },

  /**
   * 仅更新任务卡片的标题文本（局部更新，避免全量 render）
   * 目前未被调用（始终使用 full render），保留以备后用
   * @param {string} taskId - 任务 ID
   * @param {string} title - 新标题
   */
  updateTaskContent(taskId, title) {
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    if (contentEl) {
      contentEl.innerHTML = `<span class="task-card__title">${Utils.escapeHtml(title)}</span>`;
    }
  }
};