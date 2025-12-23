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

        if (vip.vipLevel > 0) {
            const discountPercent = ((1 - vip.discount) * 100).toFixed(0);
            document.getElementById('vipDiscount').textContent = discountPercent + '折';
        } else {
            document.getElementById('vipDiscount').textContent = '无';
        }

        if (vip.nextLevelThreshold) {
            const remaining = vip.nextLevelThreshold - vip.totalSpent;
            document.getElementById('nextLevel').textContent = `距离VIP${vip.vipLevel + 1}还需: ¥${remaining.toFixed(2)}`;
        } else {
            document.getElementById('nextLevel').textContent = '已达最高等级';
        }
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