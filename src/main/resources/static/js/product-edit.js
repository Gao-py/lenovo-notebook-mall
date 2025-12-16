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

(function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        document.getElementById('pageTitle').textContent = '编辑商品';
        loadProductData(productId);
    } else {
        document.getElementById('pageTitle').textContent = '添加商品';
    }
})();

async function loadProductData(id) {
    const res = await fetch('/api/products/' + id);
    const data = await res.json();
    
    if (!data.success) {
        alert('加载商品失败');
        history.back();
        return;
    }
    
    const p = data.data;
    document.getElementById('productId').value = p.id;
    document.getElementById('model').value = p.model;
    document.getElementById('name').value = p.name;
    document.getElementById('category').value = p.category || '';
    document.getElementById('price').value = p.price;
    document.getElementById('cpu').value = p.cpu || '';
    document.getElementById('memory').value = p.memory || '';
    document.getElementById('storage').value = p.storage || '';
    document.getElementById('display').value = p.display || '';
    document.getElementById('graphics').value = p.graphics || '';
    document.getElementById('description').value = p.description || '';
    document.getElementById('imageUrl').value = p.imageUrl || '';
    document.getElementById('stock').value = p.stock;
    
    if (p.imageUrl) {
        document.getElementById('previewImage').src = p.imageUrl;
        document.getElementById('previewImage').style.display = 'block';
        document.getElementById('uploadPrompt').style.display = 'none';
    }
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
        location.href = 'admin.html';
    } else {
        alert('保存失败: ' + data.message);
    }
});