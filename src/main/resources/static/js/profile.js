if (!requireAuth()) {
    location.href = 'index.html';
}

async function loadProfile() {
    const res = await fetch('/api/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    
    if (data.success) {
        const user = data.data;
        document.getElementById('username').value = user.username;
        document.getElementById('nickname').value = user.nickname || '';
        document.getElementById('signature').value = user.signature || '';
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('gender').value = user.gender || '';
        document.getElementById('birthday').value = user.birthday || '';
        
        if (user.avatar) {
            document.getElementById('previewImage').src = user.avatar;
            document.getElementById('previewImage').style.display = 'block';
            document.getElementById('uploadPrompt').style.display = 'none';
        }
    }

    await loadVipInfo();
}

async function loadVipInfo() {
    const res = await fetch('/api/vip/info', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();

    if (data.success) {
        const vip = data.data;
        document.getElementById('vipLevel').textContent = vip.vipLevel || 0;
        document.getElementById('totalSpent').textContent = vip.totalSpent ? vip.totalSpent.toFixed(2) : '0.00';

        const vipCard = document.getElementById('vipCard');
        vipCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin-bottom: 10px; font-size: 24px;">VIP ${vip.vipLevel || 0} 级会员</h3>
                    <p style="opacity: 0.9; margin-bottom: 5px;">累计消费: ¥${vip.totalSpent ? vip.totalSpent.toFixed(2) : '0.00'}</p>
                    <p style="opacity: 0.9; margin-bottom: 5px;">会员经验: ${vip.vipExperience || 0}</p>
                    <p style="opacity: 0.9; margin-bottom: 5px;">会员积分: ${vip.vipPoints || 0}</p>
                    <p style="opacity: 0.9;">当前折扣: ${vip.vipLevel > 0 ? ((1 - vip.discount) * 100).toFixed(0) + '折 (今日剩余' + vip.remainingDiscounts + '次)' : '无'}</p>
                </div>
                <div style="text-align: right;">
                    ${vip.nextLevelExp ? `<p style="opacity: 0.9; font-size: 14px;">距离VIP${vip.vipLevel + 1}还需: ${vip.nextLevelExp - vip.vipExperience} 经验值</p>` : '<p style="opacity: 0.9; font-size: 14px;">已达最高等级</p>'}
                    <button onclick="location.href='points-mall.html'" style="margin-top: 10px; padding: 8px 20px; background: white; color: #667eea; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">积分商城</button>
                </div>
            </div>
        `;
    }
}

function deleteAvatar() {
    document.getElementById('previewImage').src = '';
    document.getElementById('previewImage').style.display = 'none';
    document.getElementById('uploadPrompt').style.display = 'block';
    document.getElementById('fileInput').value = '';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('请选择图片文件');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewImage').style.display = 'block';
        document.getElementById('uploadPrompt').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

(function initDragDrop() {
    const dropZone = document.getElementById('dropZone');
    
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
            const file = files[0];
            if (!file.type.match('image.*')) {
                alert('请选择图片文件');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('previewImage').src = e.target.result;
                document.getElementById('previewImage').style.display = 'block';
                document.getElementById('uploadPrompt').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }, false);
})();

document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        nickname: document.getElementById('nickname').value,
        avatar: document.getElementById('previewImage').src || null,
        phone: document.getElementById('phone').value,
        gender: document.getElementById('gender').value,
        birthday: document.getElementById('birthday').value || null,
        signature: document.getElementById('signature').value
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
        alert('保存成功');
        loadProfile();
    } else {
        alert('保存失败: ' + data.message);
    }
});

loadProfile();