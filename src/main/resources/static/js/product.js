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
        await loadAverageRating();
        await loadSameModelProducts(currentProduct.model);
        loadComments(productId);
    } else {
        alert('商品不存在');
        location.href = 'index.html';
    }
}

async function loadAverageRating() {
    const res = await fetch(`/api/ratings/product/${productId}/average`);
    const data = await res.json();

    if (data.success && data.data) {
        const avg = data.data;
        const fullStars = Math.floor(avg);
        const hasHalfStar = avg % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        const ratingHtml = `
            <div style="display: flex; align-items: center; gap: 10px; margin: 15px 0; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                <span style="font-size: 18px; color: #ffd700;">
                    ${'★'.repeat(fullStars)}${hasHalfStar ? '⯨' : ''}${'☆'.repeat(emptyStars)}
                </span>
                <span style="font-size: 16px; color: #666;">${avg.toFixed(1)} 分</span>
            </div>
        `;

        document.querySelector('.price').insertAdjacentHTML('afterend', ratingHtml);
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
    const placeholderImage = p.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="400"%3E%3Crect width="500" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23999"%3ELenovo%3C/text%3E%3C/svg%3E';

    document.getElementById('productImg').src = placeholderImage;
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

    const addressRes = await fetch('/api/addresses', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const addressData = await addressRes.json();

    if (!addressData.success || !addressData.data || addressData.data.length === 0) {
        if (confirm('您还没有收货地址，是否前往添加？')) {
            location.href = 'address.html';
        }
        return;
    }

    const couponsRes = await fetch('/api/points-mall/my-coupons', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const couponsData = await couponsRes.json();

    const addresses = addressData.data;
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    const coupons = couponsData.success ? couponsData.data : [];

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
            ${coupons.length > 0 ? `
                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                    <div style="font-weight: bold; margin-bottom: 12px;">选择优惠券</div>
                    <select id="couponSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;">
                        <option value="">不使用优惠券</option>
                        ${coupons.map(uc => {
                            const c = uc.coupon;
                            const desc = c.type === 'DISCOUNT' ? `${c.discountPercent}折` :
                                       c.type === 'CASH' ? `¥${c.discountAmount}` :
                                       `满¥${c.minAmount}减¥${c.discountAmount}`;
                            return `<option value="${uc.id}">${c.name} - ${desc}</option>`;
                        }).join('')}
                    </select>
                </div>
            ` : ''}
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

    const couponSelect = document.getElementById('couponSelect');
    const userCouponId = couponSelect ? (couponSelect.value || null) : null;

    const checkoutRes = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
            address: `${name} ${phone} - ${address}`,
            phone: phone,
            userCouponId: userCouponId ? parseInt(userCouponId) : null
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