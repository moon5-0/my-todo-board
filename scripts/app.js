/**
 * ==================== App（应用控制器） ====================
 * 负责全局 UI 逻辑、用户操作处理和状态流转编排
 *
 * 编辑流程状态机：
 *   null ──(handleEditStart)──> editingTaskId != null ──(Enter/blur)──> handleEditComplete
 *                          └──(Escape)──> handleEditCancel
 *
 * 删除流程：
 *   null ──(handleDeleteClick)──> pendingDeleteId != null ──(confirm)──> deleteTask ──> null
 */

const App = {

  /** 当前等待删除的任务 ID（用于确认弹窗回填） */
  pendingDeleteId: null,

  /** 当前处于编辑状态的任务 ID，null 表示无任务在编辑 */
  editingTaskId: null,

  /**
   * 私有引用：编辑状态下清理函数的引用
   * 用于在编辑结束时移除事件监听器，避免内存泄漏
   * @type {Function|null}
   */
  _editCleanup: null,

  /**
   * 应用入口初始化
   * 依次初始化 Store、渲染看板、绑定事件、更新主题图标
   */
  init() {
    Store.init();
    Kanban.render();
    Kanban.bindEvents();
    this.bindGlobalEvents();
    this.updateThemeIcon();
  },

  /**
   * 绑定全局 DOM 事件（Header、GlobalInput、Modal）
   * 这些事件不经过 Kanban 的事件委托，直接绑定到对应元素
   */
  bindGlobalEvents() {
    // Header - 添加任务按钮（显示全局输入框）
    document.getElementById('btn-add-task-header').addEventListener('click', () => {
      this.toggleGlobalInput();
    });

    // Header - 主题切换按钮
    document.getElementById('btn-theme').addEventListener('click', () => {
      this.handleThemeToggle();
    });

    // GlobalInput - 添加按钮
    document.getElementById('global-btn-add').addEventListener('click', () => {
      this.handleGlobalTaskSubmit();
    });

    // GlobalInput - 取消按钮
    document.getElementById('global-btn-cancel').addEventListener('click', () => {
      this.hideGlobalInput();
    });

    // GlobalInput - 回车/ESC 快捷键
    document.getElementById('global-task-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleGlobalTaskSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault(); // 阻止浏览器默认行为（如浏览器快捷键）
        this.hideGlobalInput();
      }
    });

    // Modal - 取消按钮
    document.getElementById('modal-btn-cancel').addEventListener('click', () => {
      this.hideDeleteModal();
    });

    // Modal - 确认删除按钮
    document.getElementById('modal-btn-confirm').addEventListener('click', () => {
      this.handleDeleteConfirm();
    });

    // Modal - 点击遮罩层关闭
    document.getElementById('delete-modal').addEventListener('click', (e) => {
      if (e.target.id === 'delete-modal') {
        this.hideDeleteModal();
      }
    });
  },

  // ==================== 全局输入框（Header） ====================

  /**
   * 切换全局输入框的显示/隐藏状态
   */
  toggleGlobalInput() {
    const inputWrapper = document.getElementById('global-task-input');
    if (inputWrapper.classList.contains('is-visible')) {
      this.hideGlobalInput();
    } else {
      inputWrapper.classList.add('is-visible');
      document.getElementById('global-task-title').focus();
    }
  },

  /**
   * 隐藏全局输入框，并清空已输入的内容
   */
  hideGlobalInput() {
    const inputWrapper = document.getElementById('global-task-input');
    inputWrapper.classList.remove('is-visible');
    document.getElementById('global-task-title').value = '';
  },

  /**
   * 处理全局输入框的添加任务提交
   */
  handleGlobalTaskSubmit() {
    const titleInput = document.getElementById('global-task-title');
    const listSelect = document.getElementById('global-task-list');
    const title = titleInput.value.trim();

    if (!title) return; // 空标题不添加

    Store.addTask(title, listSelect.value);
    Kanban.render();
    this.hideGlobalInput();
  },

  // ==================== 内联输入框（各列表内） ====================

  /**
   * 在指定列表的任务区域下方显示内联输入框
   * @param {string} listId - 列表 ID
   */
  showAddInput(listId) {
    // 先隐藏其他所有内联输入框，防止多个输入框同时存在
    this.hideAllInputs();

    const listEl = document.querySelector(`[data-list-id="${listId}"]`);
    const tasksEl = listEl.querySelector('.list__tasks');

    // 如果当前有空状态占位符，先移除它
    const emptyState = tasksEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    // 插入内联输入框 HTML
    const inputHtml = `
      <div class="task-input-wrapper is-visible"
           style="border-top: 1px solid var(--border-color); padding: var(--spacing-sm);">
        <input type="text" class="task-input"
               data-list-id="${listId}"
               placeholder="输入任务标题..."
               maxlength="100"
               autofocus>
        <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
          <button class="btn btn-primary btn-add-inline" style="flex:1">添加</button>
          <button class="btn btn-ghost btn-cancel-inline">取消</button>
        </div>
      </div>
    `;
    tasksEl.insertAdjacentHTML('beforeend', inputHtml);
    tasksEl.querySelector('.task-input').focus();
  },

  /**
   * 隐藏所有列表内的内联输入框
   * 注意：不会关闭全局输入框（global-task-input）
   */
  hideAllInputs() {
    document.querySelectorAll('.list .task-input-wrapper').forEach(el => el.remove());
  },

  /**
   * 处理内联输入框的添加任务提交
   * @param {string} title - 任务标题
   * @param {string} listId - 所属列表 ID
   */
  handleTaskSubmit(title, listId) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    Store.addTask(trimmedTitle, listId);
    Kanban.render();
  },

  // ==================== 任务完成状态 ====================

  /**
   * 切换任务的完成/未完成状态
   * @param {string} taskId - 任务 ID
   */
  handleToggleComplete(taskId) {
    const task = Store.getState().tasks[taskId];
    if (!task) return;

    Store.updateTask(taskId, { completed: !task.completed });
    Kanban.render();
  },

  // ==================== 任务编辑 ====================

  /**
   * 开始编辑任务：把标题文本替换为输入框
   * @param {string} taskId - 任务 ID
   */
  handleEditStart(taskId) {
    // 如果已有其他任务在编辑，先完成编辑（保存当前进度）
    if (this.editingTaskId) {
      this.handleEditComplete();
    }

    this.editingTaskId = taskId;
    const task = Store.getState().tasks[taskId];
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);

    if (!contentEl || !task) return;

    // 为卡片添加编辑态样式（显示蓝色边框）
    cardEl.classList.add('is-editing');

    // 将标题区域替换为输入框
    contentEl.innerHTML = `
      <input type="text" class="task-card__edit-input"
             value="${Utils.escapeHtml(task.title)}"
             maxlength="100"
             autofocus>
    `;

    const input = contentEl.querySelector('input');
    input.focus();
    input.select();

    // 监听键盘事件
    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleEditComplete();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleEditCancel();
      }
    };

    input.addEventListener('keydown', handleKeydown);

    // 保存清理函数，编辑结束时移除监听器
    this._editCleanup = () => {
      input.removeEventListener('keydown', handleKeydown);
      this._editCleanup = null;
    };
  },

  /**
   * 完成编辑：保存编辑结果，重新渲染看板
   * 调用场景：Enter 键、或输入框失焦（blur）时触发
   */
  handleEditComplete() {
    if (!this.editingTaskId) return;

    const taskId = this.editingTaskId;
    const task = Store.getState().tasks[taskId];
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    const input = contentEl?.querySelector('input');

    // 读取输入框新值，只有非空且有变化时才保存
    if (input) {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== task.title) {
        Store.updateTask(taskId, { title: newTitle });
      }
    }

    // 清理事件监听器
    if (this._editCleanup) {
      this._editCleanup();
    }

    Kanban.render();
    this.editingTaskId = null;
  },

  /**
   * 取消编辑：丢弃编辑内容，恢复原始标题
   * 与 handleEditComplete 的区别是——不保存任何变更，直接恢复到编辑前的 DOM 状态
   */
  handleEditCancel() {
    if (!this.editingTaskId) return;

    // 清理事件监听器
    if (this._editCleanup) {
      this._editCleanup();
    }

    const taskId = this.editingTaskId;
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);

    // 移除编辑态样式
    if (cardEl) {
      cardEl.classList.remove('is-editing');
    }

    // 恢复原始标题文本（不经过 Store，直接恢复 DOM）
    if (contentEl) {
      const task = Store.getState().tasks[taskId];
      if (task) {
        contentEl.innerHTML = `<span class="task-card__title">${Utils.escapeHtml(task.title)}</span>`;
      }
    }

    this.editingTaskId = null;
  },

  // ==================== 删除任务 ====================

  /**
   * 显示删除确认弹窗
   * @param {string} taskId - 任务 ID
   */
  handleDeleteClick(taskId) {
    this.pendingDeleteId = taskId;
    document.getElementById('delete-modal').classList.add('is-visible');
  },

  /**
   * 隐藏删除确认弹窗
   */
  hideDeleteModal() {
    document.getElementById('delete-modal').classList.remove('is-visible');
    this.pendingDeleteId = null;
  },

  /**
   * 确认删除：执行实际删除操作
   */
  handleDeleteConfirm() {
    if (this.pendingDeleteId) {
      Store.deleteTask(this.pendingDeleteId);
      Kanban.render();
    }
    this.hideDeleteModal();
  },

  // ==================== 主题切换 ====================

  /**
   * 切换亮色/暗色主题
   */
  handleThemeToggle() {
    Store.toggleTheme();
    this.updateThemeIcon();
  },

  /**
   * 根据当前主题更新太阳/月亮图标的显示状态
   */
  updateThemeIcon() {
    const state = Store.getState();
    const sunIcon = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');

    if (state.theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
};

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});