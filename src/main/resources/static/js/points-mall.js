let allCoupons = [];
let currentFilter = 'all';

async function loadUserPoints() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            document.getElementById('userPoints').textContent = '0';
            return;
        }

        const res = await fetch('/api/profile', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success && data.data) {
            const points = data.data.vipPoints || 0;
            document.getElementById('userPoints').textContent = points.toLocaleString();
        } else {
            document.getElementById('userPoints').textContent = '0';
        }
    } catch (error) {
        console.error('加载积分失败:', error);
        document.getElementById('userPoints').textContent = '0';
    }
}

async function loadCoupons() {
    try {
        const res = await fetch('/api/points-mall/coupons');
        const data = await res.json();

        if (data.success) {
            allCoupons = data.data || [];
            filterCoupons(currentFilter);
        } else {
            displayCoupons([]);
        }
    } catch (error) {
        console.error('加载优惠券失败:', error);
        displayCoupons([]);
    }
}

function filterCoupons(type) {
    currentFilter = type;

    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = Array.from(document.querySelectorAll('.filter-tab')).find(tab => {
        return tab.textContent.includes(type === 'all' ? '全部' :
               type === 'DISCOUNT' ? '折扣券' :
               type === 'CASH' ? '代金券' : '满减券');
    });
    if (activeTab) activeTab.classList.add('active');

    const filtered = type === 'all' ? allCoupons : allCoupons.filter(c => c.type === type);
    displayCoupons(filtered);
}

function displayCoupons(coupons) {
    const list = document.getElementById('couponsList');

    if (!coupons || coupons.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🎁</div>
                <p style="font-size: 18px; margin-bottom: 10px;">暂无可兑换的优惠券</p>
                <p style="font-size: 14px; color: #999;">敬请期待更多优惠活动</p>
            </div>
        `;
        return;
    }

    const typeMap = {
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };

    const typeClass = {
        'DISCOUNT': 'discount',
        'CASH': 'cash',
        'FULL_REDUCTION': 'full-reduction'
    };

    list.innerHTML = coupons.map(c => {
        let value = '';
        let scope = '全场通用';

        if (c.type === 'DISCOUNT') {
            value = c.discountPercent + '折';
        } else if (c.type === 'CASH') {
            value = '¥' + c.discountAmount;
        } else if (c.type === 'FULL_REDUCTION') {
            value = '满' + c.minAmount + '减' + c.discountAmount;
        }

        if (c.product) scope = c.product.name;
        if (c.category) scope = c.category + '系列';

        const isUnlimited = c.stock === null || c.stock === undefined || c.stock === '';
        const stockValue = isUnlimited ? '无限' : (typeof c.stock === 'number' ? c.stock : parseInt(c.stock) || '无限');
        const stockBadge = isUnlimited ?
            '<span class="stock-badge unlimited">♾️ 无限供应</span>' :
            (stockValue < 10 ? '<span class="stock-badge limited">🔥 限量抢兑</span>' : '');

        return `
            <div class="coupon-card type-${typeClass[c.type]}">
                <div class="coupon-header type-${typeClass[c.type]}">
                    <div class="coupon-name">${c.name}</div>
                    <div class="coupon-type">${typeMap[c.type]} · ${scope}</div>
                </div>
                <div class="coupon-body">
                    <div class="coupon-value">${value}</div>
                    <div class="coupon-info">
                        <span class="coupon-info-label">所需积分</span>
                        <span class="coupon-info-value" style="color: #667eea;">🪙 ${c.pointsCost}</span>
                    </div>
                    <div class="coupon-info">
                        <span class="coupon-info-label">剩余库存</span>
                        <span class="coupon-info-value">${stockValue}${stockBadge}</span>
                    </div>
                </div>
                <div class="coupon-footer">
                    <button class="exchange-btn" onclick="exchangeCoupon(${c.id})">立即兑换</button>
                </div>
            </div>
        `;
    }).join('');
}

async function exchangeCoupon(couponId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        location.href = 'index.html';
        return;
    }

    if (!confirm('确定要兑换此优惠券吗？')) return;

    try {
        const res = await fetch(`/api/points-mall/exchange/${couponId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            alert('兑换成功！优惠券已添加到您的账户');
            loadUserPoints();
            loadCoupons();
            loadMyCoupons();
        } else {
            alert('兑换失败: ' + data.message);
        }
    } catch (error) {
        console.error('兑换失败:', error);
        alert('兑换失败，请稍后重试');
    }
}

async function loadMyCoupons() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('myCouponsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <p style="font-size: 18px; margin-bottom: 10px;">请先登录查看优惠券</p>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch('/api/points-mall/my-coupons', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (data.success) {
            displayMyCoupons(data.data);
        } else {
            document.getElementById('myCouponsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p style="font-size: 18px;">加载优惠券失败</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载我的优惠券失败:', error);
        document.getElementById('myCouponsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p style="font-size: 18px;">网络错误，请稍后重试</p>
            </div>
        `;
    }
}

function displayMyCoupons(coupons) {
    const list = document.getElementById('myCouponsList');

    if (!coupons || coupons.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎫</div>
                <p style="font-size: 18px; margin-bottom: 10px;">暂无优惠券</p>
                <p style="font-size: 14px; color: #999; margin-bottom: 20px;">快去兑换心仪的优惠券吧！</p>
                <button class="empty-state-btn" onclick="document.getElementById('exchangeSection').scrollIntoView({behavior: 'smooth'})">
                    前往兑换 →
                </button>
            </div>
        `;
        return;
    }

    const typeMap = {
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };

    list.innerHTML = coupons.map(uc => {
        const c = uc.coupon;
        let value = '';
        let scope = '全场通用';

        if (c.type === 'DISCOUNT') {
            value = c.discountPercent + '折';
        } else if (c.type === 'CASH') {
            value = '¥' + c.discountAmount;
        } else if (c.type === 'FULL_REDUCTION') {
            value = '满¥' + c.minAmount + '减¥' + c.discountAmount;
        }

        if (c.product) scope = c.product.name;
        if (c.category) scope = c.category + '系列';

        return `
            <div class="my-coupon-card">
                <div class="my-coupon-header">
                    <div>
                        <div class="my-coupon-name">${c.name}</div>
                        <div style="color: #666; font-size: 14px; margin-top: 5px;">${typeMap[c.type]} · ${scope}</div>
                    </div>
                    <div class="my-coupon-value">${value}</div>
                </div>
                <div class="my-coupon-meta">
                    <span>获得时间：${new Date(uc.obtainTime).toLocaleDateString('zh-CN')}</span>
                    <span style="margin-left: 20px; color: #52c41a;">✓ 永久有效</span>
                </div>
            </div>
        `;
    }).join('');
}

async function init() {
    await loadUserPoints();
    await loadCoupons();
    await loadMyCoupons();
}

document.addEventListener('DOMContentLoaded', init);