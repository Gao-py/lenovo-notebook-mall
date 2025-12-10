function getToken() {
    return localStorage.getItem('token') || '';
}

(function checkAdminAuth() {
    const userRole = localStorage.getItem('userRole');
    if (!userRole || userRole !== 'ADMIN') {
        alert('需要管理员权限');
        location.href = 'index.html';
    }
})();

function showSection(section) {
    document.querySelectorAll('.admin-content > div').forEach(function(div) {
        div.classList.add('hidden');
    });
    document.getElementById(section + 'Section').classList.remove('hidden');
    if (section === 'products') loadProducts();
    else if (section === 'users') loadUsers();
    else if (section === 'promotions') loadPromotions();
}

async function loadProducts() {
    const res = await fetch('/api/products');
    const list = (await res.json()).data || [];
    document.getElementById('productsList').innerHTML = list.map(function(p) {
        return '<tr><td>' + p.id + '</td><td>' + p.model + '</td><td>' + p.name + '</td><td>¥' + p.price + '</td><td>' + p.stock + '</td><td><button onclick="editProduct(' + p.id + ')">编辑</button><button onclick="deleteProduct(' + p.id + ')">删除</button></td></tr>';
    }).join('');
}

function showAddProduct() {
    document.getElementById('productModalTitle').textContent = '添加商品';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'block';
}

async function editProduct(id) {
    const res = await fetch('/api/products/' + id);
    const p = (await res.json()).data;
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
    document.getElementById('productModal').style.display = 'block';
}

async function deleteProduct(id) {
    if (!confirm('确定删除？')) return;
    const res = await fetch('/api/admin/products/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (res.ok) { alert('删除成功'); loadProducts(); }
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const payload = {
        model: document.getElementById('model').value,
        name: document.getElementById('name').value,
        price: parseFloat(document.getElementById('price').value),
        cpu: document.getElementById('cpu').value,
        memory: document.getElementById('memory').value,
        storage: document.getElementById('storage').value,
        display: document.getElementById('display').value,
        graphics: document.getElementById('graphics').value,
        description: document.getElementById('description').value,
        imageUrl: document.getElementById('imageUrl').value,
        stock: parseInt(document.getElementById('stock').value)
    };
    const url = id ? '/api/admin/products/' + id : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify(payload)
    });
    if (res.ok) { alert('保存成功'); closeProductModal(); loadProducts(); }
});

async function loadUsers() {
    const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    const list = (await res.json()).data || [];
    document.getElementById('usersList').innerHTML = list.map(function(u) {
        return '<tr><td>' + u.id + '</td><td>' + u.username + '</td><td>' + u.email + '</td><td>' + (u.phone || '-') + '</td><td>' + (u.isVip ? '是' : '否') + '</td><td>' + new Date(u.createTime).toLocaleDateString() + '</td></tr>';
    }).join('');
}

async function loadPromotions() {
    const res = await fetch('/api/promotions');
    const list = (await res.json()).data || [];
    document.getElementById('promotionsList').innerHTML = list.map(function(p) {
        return '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>' + p.discount + '%</td><td>' + new Date(p.startTime).toLocaleDateString() + '</td><td>' + new Date(p.endTime).toLocaleDateString() + '</td><td><button onclick="deletePromotion(' + p.id + ')">删除</button></td></tr>';
    }).join('');
}

function showAddPromotion() {
    const name = prompt('促销名称：');
    if (!name) return;
    const discount = parseFloat(prompt('折扣百分比（0-100）：'));
    if (isNaN(discount) || discount < 0 || discount > 100) return alert('折扣无效');
    const start = prompt('开始时间（YYYY-MM-DD）：');
    const end = prompt('结束时间（YYYY-MM-DD）：');
    if (!start || !end) return alert('时间无效');
    fetch('/api/admin/promotions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({
            name: name,
            discount: discount,
            startTime: start + 'T00:00:00',
            endTime: end + 'T23:59:59'
        })
    }).then(function(res) {
        if (res.ok) { alert('添加成功'); loadPromotions(); }
    });
}

async function deletePromotion(id) {
    if (!confirm('确定删除该促销？')) return;
    const res = await fetch('/api/admin/promotions/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (res.ok) { alert('删除成功'); loadPromotions(); }
}

showSection('products');