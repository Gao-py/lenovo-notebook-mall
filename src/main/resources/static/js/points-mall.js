// 全局变量
let allCoupons = [];
let currentFilter = 'all';

// 修改 loadUserPoints 函数
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

        if (!res.ok) {
            console.error('获取用户信息失败:', res.status, res.statusText);
            document.getElementById('userPoints').textContent = '0';
            return;
        }

        const data = await res.json();
        console.log('用户信息响应:', data); // 调试信息

        if (data.success && data.data) {
            const points = data.data.vipPoints || 0;
            document.getElementById('userPoints').textContent = points.toLocaleString();
        } else {
            console.error('用户信息格式错误:', data);
            document.getElementById('userPoints').textContent = '0';
        }
    } catch (error) {
        console.error('加载积分失败:', error);
        document.getElementById('userPoints').textContent = '0';
    }
}

// 修改 loadCoupons 函数
async function loadCoupons() {
    try {
        const res = await fetch('/api/points-mall/coupons');

        if (!res.ok) {
            console.error('获取优惠券失败:', res.status, res.statusText);
            displayCoupons([]);
            return;
        }

        const data = await res.json();
        console.log('优惠券响应:', data); // 调试信息

        if (data.success) {
            allCoupons = data.data || [];
            filterCoupons(currentFilter);
        } else {
            console.error('优惠券数据格式错误:', data);
            displayCoupons([]);
        }
    } catch (error) {
        console.error('加载优惠券失败:', error);
        displayCoupons([]);
    }
}

// 修改 filterCoupons 函数
function filterCoupons(filter, event) {
    currentFilter = filter;

    // 如果有 event 参数，更新筛选标签状态
    if (event && event.target) {
        // 更新筛选标签状态
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
    } else {
        // 如果没有 event 参数，根据当前筛选条件设置标签状态
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.textContent.includes(getFilterText(filter))) {
                tab.classList.add('active');
            }
        });
    }

    let filteredCoupons = allCoupons;

    if (filter !== 'all') {
        filteredCoupons = allCoupons.filter(coupon => coupon.type === filter);
    }

    displayCoupons(filteredCoupons);
}

// 添加辅助函数来获取筛选文本
function getFilterText(filter) {
    const filterMap = {
        'all': '全部',
        'DISCOUNT': '折扣券',
        'CASH': '代金券',
        'FULL_REDUCTION': '满减券'
    };
    return filterMap[filter] || filter;
}

// 修改 loadCoupons 函数中的调用
async function loadCoupons() {
    try {
        const res = await fetch('/api/points-mall/coupons');

        if (!res.ok) {
            console.error('获取优惠券失败:', res.status, res.statusText);
            displayCoupons([]);
            return;
        }

        const data = await res.json();
        console.log('优惠券响应:', data); // 调试信息

        if (data.success) {
            allCoupons = data.data || [];
            // 修改这里：不传递 event 参数
            filterCoupons(currentFilter);
        } else {
            console.error('优惠券数据格式错误:', data);
            displayCoupons([]);
        }
    } catch (error) {
        console.error('加载优惠券失败:', error);
        displayCoupons([]);
    }
}

// 修改 HTML 中的 onclick 事件调用
// 在 points-mall.html 中，修改筛选标签的 onclick 事件
// 从 onclick="filterCoupons('all')" 改为 onclick="filterCoupons('all', event)"

// 添加 displayCoupons 函数
function displayCoupons(coupons) {
    const list = document.getElementById('couponsList');

    if (!coupons || coupons.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="empty-icon">📭</div>
                <p style="font-size: 18px; margin: 15px 0;">暂无优惠券</p>
                <p style="color: #999; font-size: 14px;">请关注后续活动</p>
            </div>
        `;
        return;
    }

    list.innerHTML = coupons.map(coupon => {
        const typeClass = coupon.type.toLowerCase();
        let valueHtml = '';
        let stockDisplay = '';

        // 根据优惠券类型显示不同的值
        if (coupon.type === 'DISCOUNT') {
            valueHtml = `<div class="coupon-value">${coupon.discountPercent}折</div>`;
        } else if (coupon.type === 'CASH') {
            valueHtml = `<div class="coupon-value">¥${coupon.discountAmount}</div>`;
        } else if (coupon.type === 'FULL_REDUCTION') {
            valueHtml = `<div class="coupon-value">满¥${coupon.minAmount}<br>减¥${coupon.discountAmount}</div>`;
        }

        // 库存显示
        if (coupon.stock === null || coupon.stock === undefined || coupon.stock === '') {
            stockDisplay = '<span class="stock-badge unlimited">无限</span>';
        } else {
            stockDisplay = `<span class="stock-badge limited">剩余 ${coupon.stock} 张</span>`;
        }

        // 类型映射
        const typeMap = {
            'DISCOUNT': '折扣券',
            'CASH': '代金券',
            'FULL_REDUCTION': '满减券'
        };

        return `
            <div class="coupon-card type-${typeClass}">
                <div class="coupon-header type-${typeClass}">
                    <div class="coupon-name">${coupon.name}</div>
                    <div class="coupon-type">${typeMap[coupon.type]}</div>
                </div>
                <div class="coupon-body">
                    ${valueHtml}
                    <div class="coupon-info">
                        <span class="coupon-info-label">所需积分</span>
                        <span class="coupon-info-value">${coupon.pointsCost} 积分</span>
                    </div>
                    <div class="coupon-info">
                        <span class="coupon-info-label">库存</span>
                        <span class="coupon-info-value">${stockDisplay}</span>
                    </div>
                </div>
                <div class="coupon-footer">
                    <button class="exchange-btn" onclick="exchangeCoupon(${coupon.id})" 
                            ${coupon.stock !== null && coupon.stock <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        兑换
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 添加 exchangeCoupon 函数
async function exchangeCoupon(couponId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        location.href = 'index.html';
        return;
    }

    if (!confirm('确定要兑换此优惠券吗？')) {
        return;
    }

    try {
        const res = await fetch(`/api/points-mall/exchange/${couponId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await res.json();
        if (data.success) {
            alert('兑换成功！优惠券已添加到您的账户');
            // 重新加载数据
            await loadUserPoints();
            await loadCoupons();
            await loadMyCoupons();
        } else {
            alert('兑换失败: ' + data.message);
        }
    } catch (error) {
        console.error('兑换优惠券失败:', error);
        alert('兑换失败，请稍后重试');
    }
}

// 修改 loadMyCoupons 函数
async function loadMyCoupons() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('myCouponsList').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <p style="font-size: 18px; margin-bottom: 10px;">请先登录查看优惠券</p>
                <button class="empty-state-btn" onclick="location.href='index.html'">
                    前往登录 →
                </button>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch('/api/points-mall/my-coupons', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) {
            console.error('获取我的优惠券失败:', res.status, res.statusText);
            document.getElementById('myCouponsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p style="font-size: 18px;">加载失败，请刷新重试</p>
                </div>
            `;
            return;
        }

        const data = await res.json();
        console.log('我的优惠券响应:', data); // 调试信息

        if (data.success) {
            displayMyCoupons(data.data);
        } else {
            console.error('我的优惠券数据格式错误:', data);
            document.getElementById('myCouponsList').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <p style="font-size: 18px;">${data.message || '加载优惠券失败'}</p>
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

// 添加 displayMyCoupons 函数
function displayMyCoupons(userCoupons) {
    const list = document.getElementById('myCouponsList');

    if (!userCoupons || userCoupons.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎫</div>
                <p style="font-size: 18px; margin-bottom: 10px;">暂无优惠券</p>
                <p style="color: #999; font-size: 14px;">快去积分商城兑换吧！</p>
                <button class="empty-state-btn" onclick="document.getElementById('exchangeSection').scrollIntoView({behavior: 'smooth'})">
                    前往兑换 →
                </button>
            </div>
        `;
        return;
    }

    list.innerHTML = userCoupons.map(uc => {
        const coupon = uc.coupon;
        const typeMap = {
            'DISCOUNT': '折扣券',
            'CASH': '代金券',
            'FULL_REDUCTION': '满减券'
        };

        let valueDesc = '';
        if (coupon.type === 'DISCOUNT') {
            valueDesc = `${coupon.discountPercent}折`;
        } else if (coupon.type === 'CASH') {
            valueDesc = `¥${coupon.discountAmount}`;
        } else if (coupon.type === 'FULL_REDUCTION') {
            valueDesc = `满¥${coupon.minAmount}减¥${coupon.discountAmount}`;
        }

        const obtainTime = new Date(uc.obtainTime).toLocaleDateString('zh-CN');
        const status = uc.isUsed ? '已使用' : '未使用';
        const statusClass = uc.isUsed ? 'used' : 'active';

        return `
            <div class="my-coupon-card">
                <div class="my-coupon-header">
                    <div>
                        <div class="my-coupon-name">${coupon.name}</div>
                        <div class="my-coupon-value">${valueDesc}</div>
                        <div class="my-coupon-meta">
                            <span>类型: ${typeMap[coupon.type]}</span>
                            <span style="margin-left: 15px;">获取时间: ${obtainTime}</span>
                            <span style="margin-left: 15px; color: ${uc.isUsed ? '#999' : '#4CAF50'}; font-weight: 500;">
                                ${status}
                            </span>
                        </div>
                    </div>
                    ${!uc.isUsed ? `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <button class="btn-secondary" onclick="useCoupon(${uc.id})" style="padding: 8px 16px; font-size: 13px;">
                                立即使用
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 添加 useCoupon 函数
function useCoupon(userCouponId) {
    alert('在结算时选择优惠券即可使用');
    // 可以跳转到购物车页面
    // location.href = 'cart.html';
}

// 修改 init 函数，确保按顺序加载
async function init() {
    console.log('开始初始化积分商城...');

    // 检查登录状态
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录后查看积分商城');
        location.href = 'index.html';
        return;
    }

    try {
        // 按顺序加载数据
        await loadUserPoints();
        await loadCoupons();
        await loadMyCoupons();
        console.log('积分商城初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        alert('加载失败，请刷新页面重试');
    }
}

// 修改页面加载逻辑
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化积分商城');
    init();
});