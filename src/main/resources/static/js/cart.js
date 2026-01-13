if (!token) {
    alert('请先登录');
    location.href = 'index.html';
    throw new Error('未登录');
}

if (!requireAuth()) {
    location.href = 'index.html';
}

async function loadCart() {
    const res = await fetch('/api/cart', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();

    const tbody = document.getElementById('cartItems');
    if (!data.data || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">购物车是空的</td></tr>';
        document.getElementById('totalPrice').textContent = '¥0';
        return;
    }

    tbody.innerHTML = data.data.map(item => `
        <tr>
            <td>
                <div class="product-info">
                    <img src="${item.product.imageUrl || 'https://via.placeholder.com/80'}" alt="${item.product.name}">
                    <div>
                        <div>${item.product.name}</div>
                        <div style="color:#666;font-size:14px;">${item.product.model}</div>
                    </div>
                </div>
            </td>
            <td>¥${item.product.price}</td>
            <td>
                <div class="quantity-control">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${item.id}, this.value)">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </td>
            <td>¥${(item.product.price * item.quantity).toFixed(2)}</td>
            <td><span class="remove-btn" onclick="removeItem(${item.id})">删除</span></td>
        </tr>
    `).join('');

    loadTotal();
}

async function loadTotal() {
    const res = await fetch('/api/cart/total', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    document.getElementById('totalPrice').textContent = '¥' + data.data;
}

async function updateQuantity(id, quantity) {
    if (quantity < 1) return;

    const res = await fetch(`/api/cart/${id}?quantity=${quantity}`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    const data = await res.json();
    if (data.success) {
        loadCart();
    } else {
        alert(data.message);
    }
}

async function removeItem(id) {
    if (!confirm('确定要删除该商品吗?')) return;

    await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    loadCart();
}

async function clearCart() {
    if (!confirm('确定要清空购物车吗?')) return;

    await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    loadCart();
}

async function checkout() {
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

    const totalRes = await fetch('/api/cart/total', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const totalData = await totalRes.json();
    const finalTotal = totalData.data;

    const vipRes = await fetch('/api/vip/info', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const vipData = await vipRes.json();

    const addresses = addressData.data;
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    const coupons = couponsData.success ? couponsData.data : [];

    const cartRes = await fetch('/api/cart', {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const cartData = await cartRes.json();
    const originalTotal = cartData.data.reduce((sum, item) =>
        sum + (item.product.price * item.quantity), 0
    );

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>确认订单</h2>
            
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 8px;">收货地址</div>
                <div style="font-weight: bold; margin-bottom: 8px;">${defaultAddr.receiverName} ${defaultAddr.phone}</div>
                <div style="color: #666;">${defaultAddr.address}</div>
            </div>

            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 15px;">价格明细</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #666;">商品原价</span>
                    <span id="originalPrice">¥${originalTotal.toFixed(2)}</span>
                </div>
                ${originalTotal > finalTotal ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #4CAF50;">
                        <span>促销优惠</span>
                        <span id="promotionDiscount">-¥${(originalTotal - finalTotal).toFixed(2)}</span>
                    </div>
                ` : ''}
                <div id="couponDiscountRow" style="display: none; justify-content: space-between; margin-bottom: 10px; color: #FF9800;">
                    <span>优惠券优惠</span>
                    <span id="couponDiscountAmount">-¥0.00</span>
                </div>
                ${vipData.success && vipData.data.canUseDiscount ? `
                    <div id="vipDiscountRow" style="display: none; justify-content: space-between; margin-bottom: 10px; color: #9C27B0;">
                        <span>VIP${vipData.data.vipLevel}折扣 (${(vipData.data.discount * 100).toFixed(0)}折)</span>
                        <span id="vipDiscountAmount">-¥0.00</span>
                    </div>
                ` : ''}
                <div style="border-top: 2px solid #e0e0e0; margin: 15px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                    <span>应付金额</span>
                    <span style="color: #e60012;" id="finalAmount">¥${finalTotal.toFixed(2)}</span>
                </div>
            </div>

            ${coupons.length > 0 ? `
                <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
                    <div style="font-weight: bold; margin-bottom: 12px;">选择优惠券</div>
                    <select id="couponSelect" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 6px;" onchange="updateFinalPrice()">
                        <option value="">不使用优惠券</option>
                        ${coupons.map(uc => {
        const c = uc.coupon;
        const desc = c.type === 'DISCOUNT' ? `${c.discountPercent}折` :
            c.type === 'CASH' ? `¥${c.discountAmount}` :
                `满¥${c.minAmount}减¥${c.discountAmount}`;
        return `<option value="${uc.id}" data-type="${c.type}" data-percent="${c.discountPercent || ''}" data-amount="${c.discountAmount || ''}" data-min="${c.minAmount || ''}">${c.name} - ${desc}</option>`;
    }).join('')}
                    </select>
                    <div id="couponDiscountInfo" style="margin-top: 10px; color: #4CAF50; font-size: 14px;"></div>
                </div>
            ` : ''}

            <button onclick="confirmCheckout('${defaultAddr.receiverName}', '${defaultAddr.phone}', '${defaultAddr.address}')" class="btn-primary" style="width: 100%;">确认下单</button>
            <button onclick="location.href='address.html'" class="btn-secondary" style="width: 100%; margin-top: 10px;">更换地址</button>
            <button onclick="this.closest('.modal').remove()" class="btn-secondary" style="width: 100%; margin-top: 10px;">取消</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 保存数据供 updateFinalPrice 使用
    window.checkoutData = {
        originalTotal: originalTotal,
        afterPromotion: finalTotal,
        vipData: vipData
    };

    window.updateFinalPrice = function() {
        const select = document.getElementById('couponSelect');
        const option = select.options[select.selectedIndex];
        const infoDiv = document.getElementById('couponDiscountInfo');
        const couponDiscountRow = document.getElementById('couponDiscountRow');
        const vipDiscountRow = document.getElementById('vipDiscountRow');

        let currentTotal = window.checkoutData.afterPromotion;
        let couponDiscount = 0;
        let discountText = '';

        // 计算优惠券折扣
        if (option.value) {
            const type = option.dataset.type;
            const percent = parseFloat(option.dataset.percent);
            const amount = parseFloat(option.dataset.amount);
            const minAmount = parseFloat(option.dataset.min);

            if (type === 'DISCOUNT') {
                couponDiscount = currentTotal * (1 - percent / 100);
                currentTotal -= couponDiscount;
                discountText = `已优惠 ¥${couponDiscount.toFixed(2)}`;
            } else if (type === 'CASH') {
                couponDiscount = Math.min(amount, currentTotal);
                currentTotal -= couponDiscount;
                discountText = `已优惠 ¥${couponDiscount.toFixed(2)}`;
            } else if (type === 'FULL_REDUCTION') {
                if (currentTotal >= minAmount) {
                    couponDiscount = Math.min(amount, currentTotal);
                    currentTotal -= couponDiscount;
                    discountText = `已优惠 ¥${couponDiscount.toFixed(2)}`;
                } else {
                    discountText = `还差 ¥${(minAmount - currentTotal).toFixed(2)} 可使用`;
                }
            }

            // 显示优惠券折扣行
            if (couponDiscount > 0) {
                couponDiscountRow.style.display = 'flex';
                document.getElementById('couponDiscountAmount').textContent = '-¥' + couponDiscount.toFixed(2);
            } else {
                couponDiscountRow.style.display = 'none';
            }
        } else {
            couponDiscountRow.style.display = 'none';
        }

        // 计算VIP折扣
        let vipDiscount = 0;
        if (window.checkoutData.vipData.success && window.checkoutData.vipData.data.canUseDiscount) {
            vipDiscount = currentTotal * (1 - window.checkoutData.vipData.data.discount);
            currentTotal *= window.checkoutData.vipData.data.discount;

            // 显示VIP折扣行
            vipDiscountRow.style.display = 'flex';
            document.getElementById('vipDiscountAmount').textContent = '-¥' + vipDiscount.toFixed(2);
        } else if (vipDiscountRow) {
            vipDiscountRow.style.display = 'none';
        }

        // 更新最终金额
        document.getElementById('finalAmount').textContent = '¥' + currentTotal.toFixed(2);
        infoDiv.textContent = discountText;
    };
}

async function confirmCheckout(name, phone, address) {
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

loadCart();