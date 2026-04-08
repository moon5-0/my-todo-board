/**
 * ==================== Store（状态管理） ====================
 * 负责所有数据的增删改查，并将数据持久化到 localStorage
 *
 * 数据结构：
 * - state.lists: Array<{ id, name, nameEn, taskIds[], color }>  // 三列定义
 * - state.tasks: Record<taskId, { id, title, completed, listId, createdAt, updatedAt }>
 * - state.theme: 'light' | 'dark'
 */

const Store = {

  /** localStorage 存储键名 */
  STORAGE_KEY: 'todo-board-data',

  /** 当前内存状态，init 后有效 */
  state: null,

  /**
   * 首次加载时的默认数据
   * 使用 structuredClone 深度复制，避免引用污染
   */
  defaultData: {
    lists: [
      {
        id: 'list-backlog',
        name: '待办',
        nameEn: 'backlog',
        taskIds: [],
        color: 'var(--color-tag-backlog)'
      },
      {
        id: 'list-progress',
        name: '进行中',
        nameEn: 'in-progress',
        taskIds: [],
        color: 'var(--color-tag-progress)'
      },
      {
        id: 'list-done',
        name: '已完成',
        nameEn: 'done',
        taskIds: [],
        color: 'var(--color-tag-done)'
      }
    ],
    tasks: {}
  },

  /**
   * 初始化 Store
   * 优先从 localStorage 读取已保存数据；读取失败时使用默认数据
   * @returns {Object} 初始化的 state
   */
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);

    if (saved) {
      try {
        // 解析已保存的数据
        this.state = JSON.parse(saved);
        // 从保存的 theme 恢复界面主题；若数据损坏则回退到默认数据
        document.documentElement.setAttribute('data-theme', this.state.theme || 'light');
      } catch (e) {
        // localStorage 数据损坏时，使用默认数据（静默丢失损坏数据）
        this.state = structuredClone(this.defaultData);
      }
    } else {
      // 无已保存数据，使用默认数据
      this.state = structuredClone(this.defaultData);
    }

    return this.state;
  },

  /**
   * 将当前 state 持久化写入 localStorage
   */
  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  },

  /**
   * 获取当前 state 引用（内部使用，外部通过此方法访问）
   * @returns {Object} state 引用
   */
  getState() {
    return this.state;
  },

  /**
   * 生成唯一 ID
   * 格式：{prefix}-{时间戳}-{9位随机字符串}
   * @param {string} prefix - ID 前缀，如 'task'
   * @returns {string} 唯一标识符
   */
  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * 添加新任务
   * @param {string} title - 任务标题（会自动 trim 去除首尾空格）
   * @param {string} listId - 所属列表 ID
   * @returns {Object} 新创建的任务对象
   */
  addTask(title, listId) {
    const task = {
      id: this.generateId('task'),
      title: title.trim(),
      completed: false,
      listId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 将任务存入 tasks 表
    this.state.tasks[task.id] = task;

    // 将任务 ID 追加到对应列表的 taskIds 数组
    const list = this.state.lists.find(l => l.id === listId);
    if (list) {
      list.taskIds.push(task.id);
    }

    this.save();
    return task;
  },

  /**
   * 删除任务
   * @param {string} taskId - 要删除的任务 ID
   */
  deleteTask(taskId) {
    const task = this.state.tasks[taskId];
    if (!task) return; // 任务不存在则直接返回

    // 从所属列表的 taskIds 中移除该任务 ID
    const list = this.state.lists.find(l => l.id === task.listId);
    if (list) {
      list.taskIds = list.taskIds.filter(id => id !== taskId);
    }

    // 从 tasks 表中删除任务对象
    delete this.state.tasks[taskId];
    this.save();
  },

  /**
   * 更新任务属性（支持部分更新）
   * @param {string} taskId - 任务 ID
   * @param {Object} updates - 要更新的字段，如 { title: '新标题', completed: true }
   * @returns {Object} 更新后的任务对象
   */
  updateTask(taskId, updates) {
    const task = this.state.tasks[taskId];
    if (!task) return;

    // 合并更新，同时强制刷新 updatedAt 时间戳
    Object.assign(task, updates, { updatedAt: Date.now() });
    this.save();
    return task;
  },

  /**
   * 将任务从源列表移动到目标列表
   * @param {string} taskId - 任务 ID
   * @param {string} toListId - 目标列表 ID
   */
  moveTask(taskId, toListId) {
    const task = this.state.tasks[taskId];
    if (!task) return;

    const fromList = this.state.lists.find(l => l.id === task.listId);
    const toList = this.state.lists.find(l => l.id === toListId);
    if (!fromList || !toList) return;

    // 从源列表移除，加入目标列表
    fromList.taskIds = fromList.taskIds.filter(id => id !== taskId);
    toList.taskIds.push(taskId);

    // 更新任务的 listId 和时间戳
    task.listId = toListId;
    task.updatedAt = Date.now();
    this.save();
  },

  /**
   * 切换主题（亮色 <-> 暗色）
   * @returns {string} 切换后的主题名称
   */
  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.state.theme = newTheme;

    // 同步更新 <html data-theme> 属性，触发 CSS 变量切换
    document.documentElement.setAttribute('data-theme', newTheme);
    this.save();
    return newTheme;
  }
};