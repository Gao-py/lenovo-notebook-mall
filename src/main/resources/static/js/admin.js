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

// 检查URL参数，如果有editProduct参数则自动打开编辑对话框
(function checkEditParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const editProductId = urlParams.get('editProduct');
    if (editProductId) {
        setTimeout(() => editProduct(parseInt(editProductId)), 500);
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
        return '<tr><td>' + p.id + '</td><td>' + p.model + '</td><td>' + p.name + '</td><td>¥' + p.price + '</td><td>' + p.stock + '</td><td><button class="edit-btn" onclick="editProduct(' + p.id + ')">编辑</button><button class="delete-btn" onclick="deleteProduct(' + p.id + ')">删除</button></td></tr>';
    }).join('');
}

function showAddProduct() {
    location.href = 'product-edit.html';
}

async function editProduct(id) {
    location.href = 'product-edit.html?id=' + id;
}

async function deleteProduct(id) {
    if (!confirm('确定删除该商品吗？')) return;
    const res = await fetch('/api/admin/products/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (res.ok) {
        alert('删除成功');
        loadProducts();
    } else {
        alert('删除失败');
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    // 清除URL参数
    window.history.replaceState({}, document.title, 'admin.html');
}

function deleteImage() {
    document.getElementById('imageUrl').value = '';
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
        document.getElementById('imageUrl').value = e.target.result;
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('previewImage').style.display = 'block';
        document.getElementById('uploadPrompt').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

(function initDragDrop() {
    const dropZone = document.getElementById('dropZone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

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
            handleFile(files[0]);
        }
    }, false);

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imageUrl').value = e.target.result;
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('previewImage').style.display = 'block';
            document.getElementById('uploadPrompt').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
})();

document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const payload = {
        model: document.getElementById('model').value,
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
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

    if (!payload.model || !payload.name || !payload.category || !payload.price || payload.stock < 0) {
        alert('请填写必填字段');
        return;
    }

    const url = id ? '/api/admin/products/' + id : '/api/admin/products';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
        alert('保存成功');
        closeProductModal();
        loadProducts();
    } else {
        alert('保存失败: ' + data.message);
    }
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
        return '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>' + p.discount + '%</td><td>' + new Date(p.startTime).toLocaleDateString() + '</td><td>' + new Date(p.endTime).toLocaleDateString() + '</td><td><button class="delete-btn" onclick="deletePromotion(' + p.id + ')">删除</button></td></tr>';
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
        if (res.ok) {
            alert('添加成功');
            loadPromotions();
        } else {
            alert('添加失败');
        }
    });
}

async function deletePromotion(id) {
    if (!confirm('确定删除该促销吗？')) return;
    const res = await fetch('/api/admin/promotions/' + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (res.ok) {
        alert('删除成功');
        loadPromotions();
    } else {
        alert('删除失败');
    }
}

showSection('products');