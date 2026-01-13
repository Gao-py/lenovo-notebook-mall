if (!requireAuth()) {
    location.href = 'index.html';
}

// const token = localStorage.getItem('token');
// if (!token) {
//     alert('请先登录');
//     location.href = 'index.html';
//     throw new Error('未登录');
// }

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
        console.log('Profile API response:', data); // 调试信息

        if (data.success) {
            const user = data.data;
            originalProfile = { ...user };

            // 填充表单数据
            document.getElementById('username').value = user.username || '';
            document.getElementById('nickname').value = user.nickname || '';
            document.getElementById('signature').value = user.signature || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('gender').value = user.gender || '';

            // 处理生日日期格式
            if (user.birthday) {
                const birthday = new Date(user.birthday);
                document.getElementById('birthday').value = birthday.toISOString().split('T')[0];
            } else {
                document.getElementById('birthday').value = '';
            }

            // 显示头像
            if (user.avatar) {
                document.getElementById('avatarPreview').src = user.avatar;
                document.getElementById('avatarPreview').style.display = 'block';
                document.getElementById('avatarPlaceholder').style.display = 'none';
            } else {
                document.getElementById('avatarPreview').style.display = 'none';
                document.getElementById('avatarPlaceholder').style.display = 'flex';
            }

            // 更新VIP信息到个人信息区域
            updateVipInfoInProfile(user);
        } else {
            throw new Error(data.message || '加载个人信息失败');
        }

        // 加载VIP详细信息
        await loadVipInfo();
        initAvatarUpload();
        initFormValidation();
    } catch (error) {
        console.error('加载个人信息失败:', error);
        showToast('加载失败，请刷新重试', 'error');
    }
}

function updateVipInfoInProfile(user) {
    // 更新头像旁边的VIP等级
    const vipLevel = user.vipLevel || 0;
    const vipBadge = document.getElementById('vipBadge');
    if (vipBadge) {
        vipBadge.textContent = `VIP${vipLevel}`;
        vipBadge.style.display = vipLevel > 0 ? 'flex' : 'none';
    }

    // 更新积分信息
    const vipPoints = user.vipPoints || 0;
    const pointsElement = document.getElementById('userPoints');
    if (pointsElement) {
        pointsElement.textContent = vipPoints.toLocaleString();
    }

    // 更新累计消费
    const totalSpent = user.totalSpent || 0;
    const spentElement = document.getElementById('totalSpent');
    if (spentElement) {
        spentElement.textContent = totalSpent.toFixed(2);
    }

    // 更新用户名显示
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

            // 添加空值检查
            const vipLevelEl = document.getElementById('vipLevel');
            const totalSpentEl = document.getElementById('totalSpent');
            const vipPointsEl = document.getElementById('vipPoints');
            const vipDiscountEl = document.getElementById('vipDiscount');
            const progressFillEl = document.getElementById('progressFill');
            const progressTextEl = document.getElementById('progressText');
            const remainingExpEl = document.getElementById('remainingExp');
            const nextLevelNumEl = document.getElementById('nextLevelNum');
            const nextLevelTipEl = document.getElementById('nextLevelTip');
            const nextDiscountEl = document.getElementById('nextDiscount');
            const progressTipEl = document.getElementById('progressTip');

            if (vipLevelEl) vipLevelEl.textContent = vip.vipLevel || 0;
            if (totalSpentEl) totalSpentEl.textContent = vip.totalSpent ? vip.totalSpent.toFixed(2) : '0.00';
            if (vipPointsEl) vipPointsEl.textContent = vip.vipPoints || 0;

            if (vipDiscountEl) {
                if (vip.vipLevel > 0 && vip.discount) {
                    // 将折扣转换为百分比格式：如0.85 -> -15%
                    const discountPercent = Math.round((1 - vip.discount) * 100);
                    vipDiscountEl.textContent = `-${discountPercent}%`;
                } else {
                    vipDiscountEl.textContent = '无折扣';
                }
            }

            if (vip.nextLevelExp) {
                const currentExp = vip.vipExperience || 0;
                const nextExp = vip.nextLevelExp;
                const prevExp = getPrevLevelExp(vip.vipLevel || 0);
                const progress = ((currentExp - prevExp) / (nextExp - prevExp)) * 100;

                if (progressFillEl) progressFillEl.style.width = `${Math.min(progress, 100)}%`;
                if (remainingExpEl) remainingExpEl.textContent = (nextExp - currentExp).toLocaleString();
                if (nextLevelNumEl) nextLevelNumEl.textContent = (vip.vipLevel || 0) + 1;
                if (nextLevelTipEl) nextLevelTipEl.textContent = (vip.vipLevel || 0) + 1;
                if (nextDiscountEl) nextDiscountEl.textContent = getNextLevelDiscount(vip.vipLevel || 0);

                if (progressTextEl) {
                    progressTextEl.textContent = `距离 VIP${(vip.vipLevel || 0) + 1} 还需 ${(nextExp - currentExp).toLocaleString()} 经验值`;
                }
            } else {
                if (progressFillEl) progressFillEl.style.width = '100%';
                if (progressTextEl) progressTextEl.textContent = '已达最高等级';
                if (progressTipEl) progressTipEl.textContent = '您已是最高等级会员';
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
    // VIP等级对应的折扣百分比（负值表示优惠）
    const discounts = ['-10%', '-10%', '-10%', '-12%', '-15%', '-18%', '-20%'];
    return discounts[currentLevel + 1] || '-20%';
}

function initAvatarUpload() {
    const dropZone = document.getElementById('avatarDropZone');
    
    // 添加空值检查
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
    // 验证文件类型和大小
    if (!file.type.match('image.*')) {
        showToast('请选择图片文件', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast('图片大小不能超过2MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('avatarPreview').src = e.target.result;
        document.getElementById('avatarPreview').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
        avatarChanged = true;
        showToast('头像已更新，请保存修改', 'success');
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

    // 检查头像是否改变
    if (avatarChanged) return true;

    // 检查表单字段是否改变
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

        // 添加头像数据
        if (avatarChanged) {
            payload.avatar = document.getElementById('avatarPreview').src;
        }

        // 验证必填字段
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
            await loadProfile(); // 重新加载数据
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

// function changeEmail() {
//     showToast('修改邮箱功能开发中', 'info');
// }
//
// function verifyPhone() {
//     const phone = document.getElementById('phone').value;
//     if (!phone) {
//         showToast('请先输入手机号', 'warning');
//         return;
//     }
//
//     if (!/^1[3-9]\d{9}$/.test(phone)) {
//         showToast('手机号格式不正确', 'error');
//         return;
//     }
//
//     showToast('验证码已发送到您的手机', 'success');
// }
//
// function changePassword() {
//     showToast('修改密码功能开发中', 'info');
// }
//
// function manageDevices() {
//     showToast('设备管理功能开发中', 'info');
// }
//
// function viewLoginHistory() {
//     showToast('登录记录功能开发中', 'info');
// }

function showToast(message, type = 'info') {
    // 移除现有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">${getToastIcon(type)}</span>
            <span>${message}</span>
        </div>
    `;

    // 添加样式
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

    // 3秒后自动移除
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

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadProfile();

    // 添加CSS动画
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