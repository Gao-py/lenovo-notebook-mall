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
    else if (section === 'coupons') loadCoupons();
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
        const typeMap = {
            'FULL_REDUCTION': '满减',
            'DISCOUNT': '折扣',
            'CATEGORY_DISCOUNT': '分类折扣'
        };
        return '<tr><td>' + p.id + '</td><td>' + p.name + '</td><td>' + typeMap[p.type] + '</td><td>' + new Date(p.startTime).toLocaleDateString() + '</td><td>' + new Date(p.endTime).toLocaleDateString() + '</td><td><button class="delete-btn" onclick="deletePromotion(' + p.id + ')">删除</button></td></tr>';
    }).join('');
}

async function showAddPromotion() {
    const productsRes = await fetch('/api/products');
    const productsData = await productsRes.json();
    const products = productsData.data || [];

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>添加促销</h2>
            <form id="promotionForm">
                <input type="text" id="promoName" placeholder="促销名称" required style="width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <select id="promoType" required onchange="togglePromoFields()" style="width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                    <option value="">选择类型</option>
                    <option value="DISCOUNT">单品折扣</option>
                    <option value="FULL_REDUCTION">满减</option>
                    <option value="CATEGORY_DISCOUNT">分类折扣</option>
                </select>
                <select id="promoProduct" style="display:none; width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                    <option value="">选择商品</option>
                    ${products.map(p => `<option value="${p.id}">${p.name} - ${p.model}</option>`).join('')}
                </select>
                <select id="promoCategory" style="display:none; width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                    <option value="">选择分类</option>
                    <option value="ThinkPad">ThinkPad</option>
                    <option value="YOGA">YOGA</option>
                    <option value="拯救者">拯救者</option>
                    <option value="小新">小新</option>
                </select>
                <input type="number" id="promoDiscount" placeholder="折扣百分比(0-100)" min="0" max="100" style="display:none; width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <input type="number" id="promoMinAmount" placeholder="最低金额" step="0.01" style="display:none; width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <input type="number" id="promoDiscountAmount" placeholder="减免金额" step="0.01" style="display:none; width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <input type="datetime-local" id="promoStart" required style="width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <input type="datetime-local" id="promoEnd" required style="width: 100%; padding: 14px; margin: 12px 0; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                <button type="submit" class="btn-primary">保存</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    window.togglePromoFields = function() {
        const type = document.getElementById('promoType').value;
        document.getElementById('promoProduct').style.display = type === 'DISCOUNT' ? 'block' : 'none';
        document.getElementById('promoCategory').style.display = type === 'CATEGORY_DISCOUNT' ? 'block' : 'none';
        document.getElementById('promoDiscount').style.display = (type === 'DISCOUNT' || type === 'CATEGORY_DISCOUNT') ? 'block' : 'none';
        document.getElementById('promoMinAmount').style.display = type === 'FULL_REDUCTION' ? 'block' : 'none';
        document.getElementById('promoDiscountAmount').style.display = type === 'FULL_REDUCTION' ? 'block' : 'none';
    };

    document.getElementById('promotionForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const type = document.getElementById('promoType').value;
        const payload = {
            name: document.getElementById('promoName').value,
            type: type,
            startTime: document.getElementById('promoStart').value,
            endTime: document.getElementById('promoEnd').value
        };

        if (type === 'DISCOUNT') {
            const productId = document.getElementById('promoProduct').value;
            if (!productId) {
                alert('请选择商品');
                return;
            }
            payload.product = { id: parseInt(productId) };
            payload.discountPercent = parseFloat(document.getElementById('promoDiscount').value);
        } else if (type === 'CATEGORY_DISCOUNT') {
            payload.category = document.getElementById('promoCategory').value;
            payload.discountPercent = parseFloat(document.getElementById('promoDiscount').value);
        } else if (type === 'FULL_REDUCTION') {
            payload.minAmount = parseFloat(document.getElementById('promoMinAmount').value);
            payload.discountAmount = parseFloat(document.getElementById('promoDiscountAmount').value);
        }

        const res = await fetch('/api/admin/promotions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('添加成功');
            modal.remove();
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

async function loadCoupons() {
    const res = await fetch('/api/points-mall/coupons');
    const data = await res.json();
    const list = data.data || [];

    console.log('优惠券数据:', list); // 调试信息

    const typeMap = {
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };

    document.getElementById('couponsList').innerHTML = list.map(c => {
        let value = '';
        if (c.type === 'DISCOUNT') {
            value = c.discountPercent + '折';
        } else if (c.type === 'CASH') {
            value = '¥' + c.discountAmount;
        } else if (c.type === 'FULL_REDUCTION') {
            value = '满¥' + c.minAmount + '减¥' + c.discountAmount;
        }

        // 改进的库存显示逻辑
        let stockDisplay;
        if (c.stock === null || c.stock === undefined || c.stock === '') {
            stockDisplay = '无限';
        } else if (typeof c.stock === 'number') {
            stockDisplay = c.stock;
        } else if (typeof c.stock === 'string') {
            const stockNum = parseInt(c.stock);
            stockDisplay = isNaN(stockNum) ? '无限' : stockNum;
        } else {
            stockDisplay = '无限';
        }

        return `
        <tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${value}</td>
            <td>${c.pointsCost}</td>
            <td>${stockDisplay}</td>
            <td>${typeMap[c.type]}</td>
            <td>
                <button class="edit-btn" onclick="editCoupon(${c.id})">编辑</button>
                <button class="delete-btn" onclick="deleteCoupon(${c.id})">删除</button>
            </td>
        </tr>
    `;
    }).join('');
}

function showAddCoupon() {
    document.getElementById('couponModalTitle').textContent = '添加优惠券';
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
    document.getElementById('couponModal').classList.add('show');
}

async function editCoupon(id) {
    const res = await fetch('/api/points-mall/coupons');
    const data = await res.json();
    const coupon = data.data.find(c => c.id === id);

    if (coupon) {
        document.getElementById('couponModalTitle').textContent = '编辑优惠券';
        document.getElementById('couponId').value = coupon.id;
        document.getElementById('couponName').value = coupon.name;
        document.getElementById('couponType').value = coupon.type;
        document.getElementById('pointsCost').value = coupon.pointsCost;

        // 修复：使用正确的 id couponStock
        const stockValue = coupon.stock === null || coupon.stock === undefined || coupon.stock === '' ? '' : coupon.stock;
        document.getElementById('couponStock').value = stockValue;

        if (coupon.type === 'DISCOUNT') {
            document.getElementById('discountPercent').value = coupon.discountPercent;
        } else if (coupon.type === 'CASH') {
            document.getElementById('discountAmount').value = coupon.discountAmount;
        } else if (coupon.type === 'FULL_REDUCTION') {
            document.getElementById('minAmount').value = coupon.minAmount;
            document.getElementById('discountAmount').value = coupon.discountAmount;
        }

        toggleCouponFields();
        document.getElementById('couponModal').classList.add('show');
    }
}

// 修改表单提交逻辑
document.getElementById('couponForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('couponId').value;
    const type = document.getElementById('couponType').value;

    const payload = {
        name: document.getElementById('couponName').value,
        type: type,
        pointsCost: parseInt(document.getElementById('pointsCost').value),
        // 修复：使用正确的 id couponStock
        stock: document.getElementById('couponStock').value ? parseInt(document.getElementById('couponStock').value) : null
    };

    if (type === 'DISCOUNT') {
        const percent = document.getElementById('discountPercent').value;
        if (!percent) {
            alert('请输入折扣百分比');
            return;
        }
        payload.discountPercent = parseFloat(percent);
    } else if (type === 'CASH') {
        const amount = document.getElementById('discountAmount').value;
        if (!amount) {
            alert('请输入减免金额');
            return;
        }
        payload.discountAmount = parseFloat(amount);
    } else if (type === 'FULL_REDUCTION') {
        const min = document.getElementById('minAmount').value;
        const amount = document.getElementById('discountAmount').value;
        if (!min || !amount) {
            alert('请输入最低消费金额和减免金额');
            return;
        }
        payload.minAmount = parseFloat(min);
        payload.discountAmount = parseFloat(amount);
    }

    const url = id ? `/api/points-mall/admin/coupons/${id}` : '/api/points-mall/admin/coupons';
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
        closeCouponModal();
        loadCoupons();
    } else {
        alert('保存失败: ' + data.message);
    }
});

async function deleteCoupon(id) {
    if (!confirm('确定删除该优惠券吗？')) return;

    const res = await fetch(`/api/points-mall/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    const data = await res.json();
    if (data.success) {
        alert('删除成功');
        loadCoupons();
    } else {
        alert('删除失败: ' + data.message);
    }
}

// 修改关闭模态框函数
function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('show');
    document.getElementById('couponForm').reset();
    document.getElementById('couponId').value = '';
    document.getElementById('discountPercentGroup').style.display = 'none';
    document.getElementById('discountAmountGroup').style.display = 'none';
    document.getElementById('minAmountGroup').style.display = 'none';
}

// 修改 toggleCouponFields 函数，支持新的表单结构
function toggleCouponFields() {
    const type = document.getElementById('couponType').value;

    const discountPercentGroup = document.getElementById('discountPercentGroup');
    const discountAmountGroup = document.getElementById('discountAmountGroup');
    const minAmountGroup = document.getElementById('minAmountGroup');

    // 重置所有字段组
    discountPercentGroup.style.display = 'none';
    discountAmountGroup.style.display = 'none';
    minAmountGroup.style.display = 'none';

    // 重置输入框
    document.getElementById('discountPercent').value = '';
    document.getElementById('discountPercent').required = false;
    document.getElementById('discountAmount').value = '';
    document.getElementById('discountAmount').required = false;
    document.getElementById('minAmount').value = '';
    document.getElementById('minAmount').required = false;

    if (type === 'DISCOUNT') {
        discountPercentGroup.style.display = 'block';
        document.getElementById('discountPercent').required = true;
    } else if (type === 'CASH') {
        discountAmountGroup.style.display = 'block';
        document.getElementById('discountAmount').required = true;
    } else if (type === 'FULL_REDUCTION') {
        minAmountGroup.style.display = 'block';
        discountAmountGroup.style.display = 'block';
        document.getElementById('minAmount').required = true;
        document.getElementById('discountAmount').required = true;
    }
}

showSection('products');