/**
 * ==================== Utilities ====================
 * 跨模块共享的工具函数
 */

/**
 * 将文本进行 HTML 转义，防止 XSS 注入
 * @param {string} text - 原始文本
 * @returns {string} 转义后的 HTML 安全文本
 */
const Utils = {
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};