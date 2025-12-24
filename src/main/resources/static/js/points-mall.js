function displayCoupons(coupons) {
    const list = document.getElementById('couponsList');
    
    if (!coupons || coupons.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">暂无可兑换优惠券</p>';
        return;
    }
    
    const typeMap = {
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };
    
    list.innerHTML = coupons.map(c => {
        let scope = '通用';
        if (c.product) scope = `限${c.product.name}`;
        if (c.category) scope = `限${c.category}系列`;

        return `
            <div class="product-card">
                <div class="content" style="padding: 25px;">
                    <h3>${c.name}</h3>
                    <p class="model">${typeMap[c.type]} · ${scope}</p>
                    <div style="color: #e60012; font-size: 20px; margin: 15px 0;">
                        ${c.type === 'DISCOUNT' ? c.discountPercent + '折' : 
                          c.type === 'CASH' ? '¥' + c.discountAmount : 
                          '满¥' + c.minAmount + '减¥' + c.discountAmount}
                    </div>
                    <div class="price">${c.pointsCost} 积分</div>
                    ${c.stock !== null ? `<p class="stock">剩余: ${c.stock}</p>` : ''}
                    <button onclick="exchangeCoupon(${c.id})">立即兑换</button>
                </div>
            </div>
        `;
    }).join('');
}

function displayMyCoupons(coupons) {
    const list = document.getElementById('myCouponsList');
    
    if (!coupons || coupons.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无优惠券</p>';
        return;
    }
    
    const typeMap = {
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };
    
    list.innerHTML = coupons.map(uc => {
        const c = uc.coupon;
        let scope = '通用';
        if (c.product) scope = `限${c.product.name}`;
        if (c.category) scope = `限${c.category}系列`;

        return `
            <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #e60012;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin-bottom: 8px;">${c.name}</h4>
                        <p style="color: #666; margin-bottom: 5px;">${typeMap[c.type]} · ${scope}</p>
                        <p style="color: #e60012; font-size: 18px; font-weight: bold;">
                            ${c.type === 'DISCOUNT' ? c.discountPercent + '折' : 
                              c.type === 'CASH' ? '¥' + c.discountAmount : 
                              '满¥' + c.minAmount + '减¥' + c.discountAmount}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: #999; font-size: 14px;">获得时间</p>
                        <p style="color: #666;">${new Date(uc.obtainTime).toLocaleDateString('zh-CN')}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}