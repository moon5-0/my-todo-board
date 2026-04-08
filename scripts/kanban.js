// ==================== Kanban Renderer ====================
const Kanban = {
  boardEl: document.getElementById('board'),

  render() {
    const state = Store.getState();
    this.boardEl.innerHTML = state.lists.map(list => this.renderList(list)).join('');

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

  renderList(list) {
    const state = Store.getState();
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

  renderTaskCard(task) {
    return `
      <article class="task-card ${task.completed ? 'is-completed' : ''}" data-task-id="${task.id}">
        <div class="task-card__checkbox ${task.completed ? 'is-checked' : ''}" data-action="toggle-complete" data-task-id="${task.id}">
          ${Icons.check}
        </div>
        <div class="task-card__content ${task.completed ? 'is-completed' : ''}" data-task-content="${task.id}">
          <span class="task-card__title">${this.escapeHtml(task.title)}</span>
        </div>
        <div class="task-card__actions">
          <button class="btn-icon btn-edit" data-action="edit-task" data-task-id="${task.id}" title="编辑">
            ${Icons.edit}
          </button>
          <button class="btn-icon btn-delete" data-action="delete-task" data-task-id="${task.id}" title="删除">
            ${Icons.trash}
          </button>
        </div>
      </article>
    `;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  bindEvents() {
    this.boardEl.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;

      const actionType = action.dataset.action;
      const taskId = action.dataset.taskId;
      const listId = action.dataset.listId;

      switch (actionType) {
        case 'add-to-list':
          App.showAddInput(listId);
          break;
        case 'toggle-complete':
          App.handleToggleComplete(taskId);
          break;
        case 'edit-task':
          App.handleEditStart(taskId);
          break;
        case 'delete-task':
          App.handleDeleteClick(taskId);
          break;
      }
    });

    this.boardEl.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('task-input') && e.key === 'Enter') {
        e.preventDefault();
        const listId = e.target.dataset.listId;
        App.handleTaskSubmit(e.target.value, listId);
      }
      if (e.target.classList.contains('task-input') && e.key === 'Escape') {
        e.preventDefault();
        App.hideAllInputs();
      }
    });

    this.boardEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add-inline')) {
        const input = e.target.closest('.task-input-wrapper').querySelector('.task-input');
        const listId = input.dataset.listId;
        App.handleTaskSubmit(input.value, listId);
      }
      if (e.target.classList.contains('btn-cancel-inline')) {
        App.hideAllInputs();
      }
    });
  },

  updateTaskContent(taskId, title) {
    const contentEl = document.querySelector(`[data-task-content="${taskId}"]`);
    if (contentEl) {
      contentEl.innerHTML = `<span class="task-card__title">${this.escapeHtml(title)}</span>`;
    }
  }
};
