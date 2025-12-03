if (!token) {
    alert('请先登录');
    location.href = 'index.html';
}

function showSection(section) {
    document.getElementById('productsSection').classList.add('hidden');
    document.getElementById('usersSection').classList.add('hidden');
    document.getElementById('promotionsSection').classList.add('hidden');
    
    document.getElementById(section + 'Section').classList.remove('hidden');
    
    if (section === 'products') loadProducts();
    if (section === 'users') loadUsers();
    if (section === 'promotions') loadPromotions();
}

async function loadProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    
    const tbody = document.getElementById('productsList');
    tbody.innerHTML = data.data.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.model}</td>
            <td>${p.name}</td>
            <td>¥${p.price}</td>
            <td>${p.stock}</td>
            <td>
                <button class="edit-btn" onclick="editProduct(${p.id})">编辑</button>
                <button class="delete-btn" onclick="deleteProduct(${p.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function showAddProduct() {
    document.getElementById('productModalTitle').textContent = '添加商品';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('show');
}

async function editProduct(id) {
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    const p = data.data;
    
    document.getElementById('productModalTitle').textContent = '编辑商品';
    document.getElementById('productId').value = p.id;
    document.getElementById('model').value = p.model;
    document.getElementById('name').value = p.name;
    document.getElementById('price').value = p.price;
    document.getElementById('cpu').value = p.cpu || '';
    document.getElementById('memory').value = p.memory || '';
    document.getElementById('storage').value = p.storage || '';
    document.getElementById('display').value = p.display || '';
    document.getElementById('graphics').value = p.graphics || '';
    document.getElementById('description').value = p.description || '';
    document.getElementById('imageUrl').value = p.imageUrl || '';
    document.getElementById('stock').value = p.stock;
    
    document.getElementById('productModal').classList.add('show');
}

async function deleteProduct(id) {
    if (!confirm('确定要删除该商品吗?')) return;
    
    await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    loadProducts();
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const product = {
        model: document.getElementById('model').value,
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        cpu: document.getElementById('cpu').value,
        memory: document.getElementById('memory').value,
        storage: document.getElementById('storage').value,
        display: document.getElementById('display').value,
        graphics: document.getElementById('graphics').value,
        description: document.getElementById('description').value,
        imageUrl: document.getElementById('imageUrl').value,
        stock: document.getElementById('stock').value
    };
    
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(product)
    });
    
    const data = await res.json();
    if (data.success) {
        alert('保存成功');
        closeProductModal();
        loadProducts();
    } else {
        alert(data.message);
    }
});

async function loadUsers() {
    const res = await fetch('/api/products');
    const data = await res.json();
    
    const tbody = document.getElementById('usersList');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">用户管理功能开发中...</td></tr>';
}

async function loadPromotions() {
    const tbody = document.getElementById('promotionsList');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">促销管理功能开发中...</td></tr>';
}

function showAddPromotion() {
    alert('促销管理功能开发中...');
}

loadProducts();