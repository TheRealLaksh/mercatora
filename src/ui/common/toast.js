export const Toast = {
  init() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  },
  
  show(message, type = 'info') {
    this.init();
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Color coding
    if (type === 'success') toast.style.borderLeftColor = 'var(--success-color)';
    if (type === 'error') toast.style.borderLeftColor = 'var(--danger-color)';
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};