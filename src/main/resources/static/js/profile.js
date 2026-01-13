if (!requireAuth()) {
    location.href = 'index.html';
}

let originalProfile = null;
let avatarChanged = false;

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            location.href = 'index.html';
            return;
        }

        const res = await fetch('/api/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.success) {
            const user = data.data;
            originalProfile = { ...user };

            document.getElementById('username').value = user.username || '';
            document.getElementById('nickname').value = user.nickname || '';
            document.getElementById('signature').value = user.signature || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('gender').value = user.gender || '';

            if (user.birthday) {
                const birthday = new Date(user.birthday);
                document.getElementById('birthday').value = birthday.toISOString().split('T')[0];
            } else {
                document.getElementById('birthday').value = '';
            }

            if (user.avatar) {
                document.getElementById('avatarPreview').src = user.avatar;
                document.getElementById('avatarPreview').style.display = 'block';
                document.getElementById('avatarPlaceholder').style.display = 'none';
            } else {
                document.getElementById('avatarPreview').style.display = 'none';
                document.getElementById('avatarPlaceholder').style.display = 'flex';
            }

            updateVipInfoInProfile(user);
        } else {
            throw new Error(data.message || '加载个人信息失败');
        }

        await loadVipInfo();
        initAvatarUpload();
        initFormValidation();
    } catch (error) {
        console.error('加载个人信息失败:', error);
        showToast('加载失败，请刷新重试', 'error');
    }
}

function updateVipInfoInProfile(user) {
    const vipLevel = user.vipLevel || 0;
    const vipBadge = document.getElementById('vipBadge');
    if (vipBadge) {
        vipBadge.textContent = `VIP${vipLevel}`;
        vipBadge.style.display = vipLevel > 0 ? 'flex' : 'none';
    }

    const vipPoints = user.vipPoints || 0;
    const pointsElement = document.getElementById('userPoints');
    if (pointsElement) {
        pointsElement.textContent = vipPoints.toLocaleString();
    }

    const totalSpent = user.totalSpent || 0;
    const spentElement = document.getElementById('totalSpent');
    if (spentElement) {
        spentElement.textContent = totalSpent.toFixed(2);
    }

    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = user.nickname || user.username;
    }
}

async function loadVipInfo() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/vip/info', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data.success) {
            const vip = data.data;

            const vipDiscountEl = document.getElementById('vipDiscount');
            if (vipDiscountEl) {
                if (vip.vipLevel > 0 && vip.discount) {
                    const discountPercent = Math.round((1 - vip.discount) * 100);
                    vipDiscountEl.textContent = `-${discountPercent}%`;
                } else {
                    vipDiscountEl.textContent = '无折扣';
                }
            }

            const currentExp = vip.vipExperience || 0;
            const currentLevel = vip.vipLevel || 0;
            const prevLevelExp = getPrevLevelExp(currentLevel);
            const nextLevelExp = vip.nextLevelExp;

            if (nextLevelExp) {
                const expNeeded = nextLevelExp - prevLevelExp;
                const expGained = currentExp - prevLevelExp;
                const progressPercent = Math.min(100, Math.max(0, (expGained / expNeeded) * 100));

                const progressFill = document.getElementById('progressFill');
                if (progressFill) {
                    progressFill.style.width = progressPercent.toFixed(1) + '%';
                }

                const remainingExp = nextLevelExp - currentExp;
                const nextLevelNum = document.getElementById('nextLevelNum');
                const remainingExpEl = document.getElementById('remainingExp');
                if (nextLevelNum) nextLevelNum.textContent = currentLevel + 1;
                if (remainingExpEl) remainingExpEl.textContent = remainingExp.toLocaleString();

                const nextLevelTip = document.getElementById('nextLevelTip');
                const nextDiscountEl = document.getElementById('nextDiscount');
                if (nextLevelTip) nextLevelTip.textContent = currentLevel + 1;
                if (nextDiscountEl) nextDiscountEl.textContent = getNextLevelDiscount(currentLevel);
            } else {
                const progressFill = document.getElementById('progressFill');
                if (progressFill) progressFill.style.width = '100%';

                const progressText = document.getElementById('progressText');
                if (progressText) progressText.textContent = '已达到最高等级';

                const progressTip = document.getElementById('progressTip');
                if (progressTip) progressTip.textContent = '恭喜您已达到最高VIP等级！';
            }
        }
    } catch (error) {
        console.error('加载VIP信息失败:', error);
    }
}

function getPrevLevelExp(currentLevel) {
    const thresholds = [0, 3600, 9600, 30000, 75000, 200000, 600000];
    return thresholds[currentLevel] || 0;
}

function getNextLevelDiscount(currentLevel) {
    const discounts = ['-10%', '-10%', '-10%', '-12%', '-15%', '-18%', '-20%'];
    return discounts[currentLevel + 1] || '-20%';
}

function initAvatarUpload() {
    const dropZone = document.getElementById('avatarDropZone');

    if (!dropZone) {
        console.warn('avatarDropZone 元素不存在');
        return;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, function() {
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, function() {
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', function(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAvatarFile(files[0]);
        }
    }, false);
}

function handleAvatarSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleAvatarFile(file);
    }
}

function handleAvatarFile(file) {
    if (!file.type.match('image.*')) {
        showToast('请选择图片文件', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast('图片大小不能超过2MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        document.getElementById('avatarPreview').src = e.target.result;
        document.getElementById('avatarPreview').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('请先登录', 'error');
                return;
            }

            const payload = {
                avatar: e.target.result
            };

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                showToast('头像更新成功', 'success');
                avatarChanged = false;
                await loadProfile();
            } else {
                throw new Error(data.message || '保存失败');
            }
        } catch (error) {
            showToast('头像保存失败: ' + error.message, 'error');
            if (originalProfile && originalProfile.avatar) {
                document.getElementById('avatarPreview').src = originalProfile.avatar;
            } else {
                document.getElementById('avatarPreview').style.display = 'none';
                document.getElementById('avatarPlaceholder').style.display = 'flex';
            }
        }
    };
    reader.readAsDataURL(file);
}

function initFormValidation() {
    const inputs = document.querySelectorAll('#nickname, #signature, #phone, #gender, #birthday');

    inputs.forEach(input => {
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
            input.addEventListener('input', checkFormChanges);
            input.addEventListener('change', checkFormChanges);
        }
    });
}

function checkFormChanges() {
    const saveBtn = document.getElementById('saveBtn');
    const hasChanges = checkIfProfileChanged();

    if (hasChanges) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = '1';
    } else {
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.5';
    }
}

function checkIfProfileChanged() {
    if (!originalProfile) return false;

    if (avatarChanged) return true;

    const currentData = {
        nickname: document.getElementById('nickname').value,
        signature: document.getElementById('signature').value,
        phone: document.getElementById('phone').value,
        gender: document.getElementById('gender').value,
        birthday: document.getElementById('birthday').value
    };

    const originalData = {
        nickname: originalProfile.nickname || '',
        signature: originalProfile.signature || '',
        phone: originalProfile.phone || '',
        gender: originalProfile.gender || '',
        birthday: originalProfile.birthday ? new Date(originalProfile.birthday).toISOString().split('T')[0] : ''
    };

    return JSON.stringify(currentData) !== JSON.stringify(originalData);
}

async function saveProfile() {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.classList.add('saving');
    saveBtn.textContent = '保存中...';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('请先登录');
        }

        const payload = {
            nickname: document.getElementById('nickname').value.trim(),
            signature: document.getElementById('signature').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            gender: document.getElementById('gender').value,
            birthday: document.getElementById('birthday').value || null
        };

        if (!payload.nickname) {
            throw new Error('昵称不能为空');
        }

        if (payload.phone && !/^1[3-9]\d{9}$/.test(payload.phone)) {
            throw new Error('手机号格式不正确');
        }

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            showToast('保存成功', 'success');
            avatarChanged = false;
            // 重新加载数据以刷新页面
            await loadProfile();
        } else {
            throw new Error(data.message || '保存失败');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('saving');
        saveBtn.textContent = '保存修改';
        checkFormChanges();
    }
}

function showVipDetails() {
    document.getElementById('vipModal').style.display = 'flex';
}

function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">${getToastIcon(type)}</span>
            <span>${message}</span>
        </div>
    `;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadProfile();

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});