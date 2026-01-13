// 统一的提示工具
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">${icons[type]}</span>
                <span>${message}</span>
            </div>
        `;

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            max-width: 400px;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// 确认对话框
const Confirm = {
    show(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'confirm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.2s ease;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                <div style="font-size: 18px; color: #333; margin-bottom: 20px; line-height: 1.6;">${message}</div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 10px 24px; background: #f5f5f5; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">取消</button>
                    <button class="confirm-btn" style="padding: 10px 24px; background: #e60012; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.cancel-btn').onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };

        modal.querySelector('.confirm-btn').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        };
    }
};

// 添加CSS动画
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}