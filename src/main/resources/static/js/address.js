if (!requireAuth()) {
    location.href = 'index.html';
}

async function loadAddresses() {
    const res = await fetch('/api/addresses', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    
    if (data.success) {
        displayAddresses(data.data);
    }
}

function displayAddresses(addresses) {
    const list = document.getElementById('addressList');
    
    if (!addresses || addresses.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无收货地址</p>';
        return;
    }
    
    list.innerHTML = addresses.map(addr => `
        <div class="address-card" style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 2px solid ${addr.isDefault ? '#e60012' : '#e0e0e0'};">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 8px;">
                        ${addr.receiverName} ${addr.phone}
                        ${addr.isDefault ? '<span style="color: #e60012; font-size: 12px; margin-left: 10px;">[默认]</span>' : ''}
                    </div>
                    <div style="color: #666;">${addr.address}</div>
                </div>
                <div style="display: flex; gap: 10px; flex-direction: column;">
                    ${!addr.isDefault ? `<button class="btn-primary" onclick="setDefault(${addr.id})">设为默认</button>` : ''}
                    <button class="btn-secondary" onclick="editAddress(${addr.id})">编辑</button>
                    <button class="btn-secondary" onclick="deleteAddress(${addr.id})" style="background: #f44336;">删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddAddressModal() {
    document.getElementById('addressModalTitle').textContent = '添加收货地址';
    document.getElementById('addressForm').reset();
    document.getElementById('addressId').value = '';
    document.getElementById('addressModal').classList.add('show');
}

async function editAddress(id) {
    const res = await fetch('/api/addresses', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    
    if (data.success) {
        const addr = data.data.find(a => a.id === id);
        if (addr) {
            document.getElementById('addressModalTitle').textContent = '编辑收货地址';
            document.getElementById('addressId').value = addr.id;
            document.getElementById('receiverName').value = addr.receiverName;
            document.getElementById('addressPhone').value = addr.phone;
            document.getElementById('addressDetail').value = addr.address;
            document.getElementById('addressModal').classList.add('show');
        }
    }
}

async function setDefault(id) {
    const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ isDefault: true })
    });
    
    const data = await res.json();
    if (data.success) {
        loadAddresses();
    }
}

async function deleteAddress(id) {
    if (!confirm('确定删除该地址吗？')) return;
    
    await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    loadAddresses();
}

function closeAddressModal() {
    document.getElementById('addressModal').classList.remove('show');
}

document.getElementById('addressForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('addressId').value;
    const payload = {
        receiverName: document.getElementById('receiverName').value,
        phone: document.getElementById('addressPhone').value,
        address: document.getElementById('addressDetail').value,
        isDefault: false
    };
    
    const url = id ? `/api/addresses/${id}` : '/api/addresses';
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
        alert('保存成功');
        closeAddressModal();
        loadAddresses();
    } else {
        alert('保存失败: ' + data.message);
    }
});

loadAddresses();