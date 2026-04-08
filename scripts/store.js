// ==================== Store ====================
const Store = {
  STORAGE_KEY: 'todo-board-data',

  state: null,

  defaultData: {
    lists: [
      { id: 'list-backlog', name: '待办', nameEn: 'backlog', taskIds: [], color: 'var(--color-tag-backlog)' },
      { id: 'list-progress', name: '进行中', nameEn: 'in-progress', taskIds: [], color: 'var(--color-tag-progress)' },
      { id: 'list-done', name: '已完成', nameEn: 'done', taskIds: [], color: 'var(--color-tag-done)' }
    ],
    tasks: {}
  },

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        document.documentElement.setAttribute('data-theme', this.state.theme || 'light');
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(this.defaultData));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(this.defaultData));
    }
    return this.state;
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  },

  getState() {
    return this.state;
  },

  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  addTask(title, listId) {
    const task = {
      id: this.generateId('task'),
      title: title.trim(),
      completed: false,
      listId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.state.tasks[task.id] = task;
    const list = this.state.lists.find(l => l.id === listId);
    if (list) {
      list.taskIds.push(task.id);
    }
    this.save();
    return task;
  },

  deleteTask(taskId) {
    const task = this.state.tasks[taskId];
    if (!task) return;
    const list = this.state.lists.find(l => l.id === task.listId);
    if (list) {
      list.taskIds = list.taskIds.filter(id => id !== taskId);
    }
    delete this.state.tasks[taskId];
    this.save();
  },

  updateTask(taskId, updates) {
    const task = this.state.tasks[taskId];
    if (!task) return;
    Object.assign(task, updates, { updatedAt: Date.now() });
    this.save();
    return task;
  },

  moveTask(taskId, toListId) {
    const task = this.state.tasks[taskId];
    if (!task) return;
    const fromList = this.state.lists.find(l => l.id === task.listId);
    const toList = this.state.lists.find(l => l.id === toListId);
    if (!fromList || !toList) return;
    fromList.taskIds = fromList.taskIds.filter(id => id !== taskId);
    toList.taskIds.push(taskId);
    task.listId = toListId;
    task.updatedAt = Date.now();
    this.save();
  },

  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.theme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    this.save();
    return newTheme;
  }
};
