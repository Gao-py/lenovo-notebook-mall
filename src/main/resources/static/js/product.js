const urlParams = new URLSearchParams(window.location.search);
let productId = urlParams.get('id');
let currentProduct = null;
let sameModelProducts = [];

async function loadProduct() {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();

    if (data.success) {
        currentProduct = data.data;
        displayProduct(currentProduct);
        await loadSameModelProducts(currentProduct.model);
        loadComments(productId);
    } else {
        alert('商品不存在');
        location.href = 'index.html';
    }
}

async function loadSameModelProducts(model) {
    const res = await fetch(`/api/products/model/${encodeURIComponent(model)}`);
    const data = await res.json();

    if (data.success && data.data.length > 1) {
        sameModelProducts = data.data;
        displayConfigSelector();
    }
}

function displayProduct(p) {
    document.getElementById('productImg').src = p.imageUrl || 'https://via.placeholder.com/500x400?text=Lenovo';
    document.getElementById('productName').textContent = p.name;
    document.getElementById('productModel').textContent = p.model;
    document.getElementById('productPrice').textContent = '¥' + p.price;
    document.getElementById('cpu').textContent = p.cpu || '暂无';
    document.getElementById('memory').textContent = p.memory || '暂无';
    document.getElementById('storage').textContent = p.storage || '暂无';
    document.getElementById('display').textContent = p.display || '暂无';
    document.getElementById('graphics').textContent = p.graphics || '暂无';
    document.getElementById('description').textContent = p.description || '暂无描述';
    document.getElementById('stock').textContent = p.stock;
    document.getElementById('sales').textContent = p.sales;
}

function displayConfigSelector() {
    const priceElement = document.querySelector('.price');
    const existingSelector = document.getElementById('configSelector');
    if (existingSelector) {
        existingSelector.remove();
    }

    const selectorHtml = `
        <div class="config-selector" id="configSelector">
            <h3>选择配置</h3>
            <div class="config-options">
                ${sameModelProducts.map(p => `
                    <div class="config-option ${p.id == productId ? 'active' : ''}" onclick="switchProduct(${p.id})">
                        <div class="config-name">${getConfigName(p)}</div>
                        <div class="config-price">¥${p.price}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    priceElement.insertAdjacentHTML('afterend', selectorHtml);
}

function getConfigName(product) {
    const parts = [];
    if (product.cpu) parts.push(product.cpu.split(' ')[0]);
    if (product.memory) parts.push(product.memory);
    if (product.storage) parts.push(product.storage);
    return parts.join(' / ') || product.name;
}

function switchProduct(newProductId) {
    productId = newProductId;
    window.history.replaceState({}, '', `product.html?id=${productId}`);
    loadProduct();
}

async function addToCart() {
    if (!requireAuth()) return;

    const quantity = document.getElementById('quantity').value;
    const res = await fetch(`/api/cart/add?productId=${productId}&quantity=${quantity}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();
    if (data.success) {
        alert('已加入购物车');
    } else {
        alert(data.message);
    }
}

async function buyNow() {
    if (!requireAuth()) return;

    const quantity = parseInt(document.getElementById('quantity').value);

    const res = await fetch('/api/addresses', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
        if (confirm('您还没有收货地址，是否前往添加？')) {
            location.href = 'address.html';
        }
        return;
    }

    const addresses = data.data;
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>确认订单</h2>
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 8px;">商品信息</div>
                <div style="color: #666;">${currentProduct.name} x ${quantity}</div>
                <div style="color: #e60012; font-size: 18px; font-weight: bold; margin-top: 8px;">
                    总计: ¥${(currentProduct.price * quantity).toFixed(2)}
                </div>
            </div>
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 8px;">收货地址</div>
                <div style="font-weight: bold; margin-bottom: 8px;">${defaultAddr.receiverName} ${defaultAddr.phone}</div>
                <div style="color: #666;">${defaultAddr.address}</div>
            </div>
            <button onclick="confirmBuyNow(${quantity}, '${defaultAddr.receiverName}', '${defaultAddr.phone}', '${defaultAddr.address}')" class="btn-primary">确认下单</button>
            <button onclick="location.href='address.html'" class="btn-secondary" style="margin-left: 10px;">更换地址</button>
            <button onclick="this.closest('.modal').remove()" class="btn-secondary" style="margin-left: 10px;">取消</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function confirmBuyNow(quantity, name, phone, address) {
    await fetch(`/api/cart/add?productId=${productId}&quantity=${quantity}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const checkoutRes = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            address: `${name} ${phone} - ${address}`,
            phone: phone
        })
    });

    const checkoutData = await checkoutRes.json();
    if (checkoutData.success) {
        alert('订单创建成功！订单号: ' + checkoutData.data.id);
        location.href = 'orders.html';
    } else {
        alert('下单失败: ' + checkoutData.message);
    }
}

loadProduct();