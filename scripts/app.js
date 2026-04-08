// ==================== App ====================
const App = {
  pendingDeleteId: null,
  editingTaskId: null,

  init() {
    Store.init();
    Kanban.render();
    Kanban.bindEvents();
    this.bindGlobalEvents();
    this.updateThemeIcon();
  },

  bindGlobalEvents() {
    document.getElementById('btn-add-task-header').addEventListener('click', () => {
      this.toggleGlobalInput();
    });

    document.getElementById('btn-theme').addEventListener('click', () => {
      this.handleThemeToggle();
    });

    document.getElementById('global-btn-add').addEventListener('click', () => {
      this.handleGlobalTaskSubmit();
    });

    document.getElementById('global-btn-cancel').addEventListener('click', () => {
      this.hideGlobalInput();
    });

    document.getElementById('global-task-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleGlobalTaskSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.hideGlobalInput();
      }
    });

    document.getElementById('modal-btn-cancel').addEventListener('click', () => {
      this.hideDeleteModal();
    });

    document.getElementById('modal-btn-confirm').addEventListener('click', () => {
      this.handleDeleteConfirm();
    });

    document.getElementById('delete-modal').addEventListener('click', (e) => {
      if (e.target.id === 'delete-modal') {
        this.hideDeleteModal();
      }
    });
  },

  handleGlobalTaskSubmit() {
    const titleInput = document.getElementById('global-task-title');
    const listSelect = document.getElementById('global-task-list');
    const title = titleInput.value.trim();

    if (!title) return;

    Store.addTask(title, listSelect.value);
    Kanban.render();
    this.hideGlobalInput();
  },

  showAddInput(listId) {
    this.hideAllInputs();

    const listEl = document.querySelector(`[data-list-id="${listId}"]`);
    const tasksEl = listEl.querySelector('.list__tasks');

    const emptyState = tasksEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const inputHtml = `
      <div class="task-input-wrapper is-visible" style="border-top: 1px solid var(--border-color); padding: var(--spacing-sm);">
        <input type="text" class="task-input" data-list-id="${listId}" placeholder="输入任务标题..." maxlength="100" autofocus>
        <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
          <button class="btn btn-primary btn-add-inline" style="flex:1">添加</button>
          <button class="btn btn-ghost btn-cancel-inline">取消</button>
        </div>
      </div>
    `;
    tasksEl.insertAdjacentHTML('beforeend', inputHtml);
    tasksEl.querySelector('.task-input').focus();
  },

  hideAllInputs() {
    document.querySelectorAll('.list .task-input-wrapper').forEach(el => el.remove());
  },

  toggleGlobalInput() {
    const inputWrapper = document.getElementById('global-task-input');
    if (inputWrapper.classList.contains('is-visible')) {
      this.hideGlobalInput();
    } else {
      inputWrapper.classList.add('is-visible');
      document.getElementById('global-task-title').focus();
    }
  },

  hideGlobalInput() {
    const inputWrapper = document.getElementById('global-task-input');
    inputWrapper.classList.remove('is-visible');
    document.getElementById('global-task-title').value = '';
  },

  handleTaskSubmit(title, listId) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    Store.addTask(trimmedTitle, listId);
    Kanban.render();
  },

  handleToggleComplete(taskId) {
    const task = Store.getState().tasks[taskId];
    if (!task) return;

    Store.updateTask(taskId, { completed: !task.completed });
    Kanban.render();
  },

  handleEditStart(taskId) {
    if (this.editingTaskId) {
      this.handleEditCancel();
    }

    this.editingTaskId = taskId;
    const task = Store.getState().tasks[taskId];
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    const cardEl = document.querySelector(`[data-task-id="${taskId}"]`);

    if (!contentEl || !task) return;

    cardEl.classList.add('is-editing');
    contentEl.innerHTML = `
      <input type="text" class="task-card__edit-input" value="${this.escapeHtml(task.title)}" maxlength="100" autofocus>
    `;

    const input = contentEl.querySelector('input');
    input.focus();
    input.select();

    const handleSubmit = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== task.title) {
          Store.updateTask(taskId, { title: newTitle });
        }
        Kanban.render();
        this.editingTaskId = null;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.handleEditCancel();
      }
    };

    input.addEventListener('keydown', handleSubmit);
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (this.editingTaskId === taskId) {
          const newTitle = input.value.trim();
          if (newTitle && newTitle !== task.title) {
            Store.updateTask(taskId, { title: newTitle });
          }
          Kanban.render();
          this.editingTaskId = null;
        }
      }, 100);
    });
  },

  handleEditCancel() {
    if (!this.editingTaskId) return;
    Kanban.render();
    this.editingTaskId = null;
  },

  handleDeleteClick(taskId) {
    this.pendingDeleteId = taskId;
    document.getElementById('delete-modal').classList.add('is-visible');
  },

  hideDeleteModal() {
    document.getElementById('delete-modal').classList.remove('is-visible');
    this.pendingDeleteId = null;
  },

  handleDeleteConfirm() {
    if (this.pendingDeleteId) {
      Store.deleteTask(this.pendingDeleteId);
      Kanban.render();
    }
    this.hideDeleteModal();
  },

  handleThemeToggle() {
    Store.toggleTheme();
    this.updateThemeIcon();
  },

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
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
