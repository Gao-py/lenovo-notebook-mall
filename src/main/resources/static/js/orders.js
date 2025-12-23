async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('/api/orders/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
            displayOrders(result.data);
        } else {
            alert('加载订单失败: ' + result.message);
        }
    } catch (error) {
        console.error('加载订单错误:', error);
        alert('加载订单失败');
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">暂无订单</p>';
        return;
    }

    const statusMap = {
        'PENDING': '待支付',
        'PAID': '已支付',
        'SHIPPED': '已发货',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
    };

    ordersList.innerHTML = '<div class="orders-container">' +
        orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span>订单号: ${order.id}</span>
                    <span class="order-status status-${order.status.toLowerCase()}">${statusMap[order.status] || order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>收货地址:</strong> ${order.address || '未填写'}</p>
                    <p><strong>下单时间:</strong> ${new Date(order.createTime).toLocaleString('zh-CN')}</p>
                </div>
                <div class="order-items">
                    ${order.items && order.items.length > 0 ? order.items.map(item => `
                        <div class="order-product">
                            <img src="${item.product?.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.product?.name || '商品'}">
                            <div class="product-info">
                                <h4>${item.product?.name || '商品'}</h4>
                                <p>数量: ${item.quantity}</p>
                                <p class="price">¥${item.price ? item.price.toFixed(2) : '0.00'}</p>
                            </div>
                        </div>
                    `).join('') : '<p>暂无商品信息</p>'}
                </div>
                <div class="order-footer">
                    <span class="total-price">订单总额: ¥${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        `).join('') +
    '</div>';
}

loadOrders();