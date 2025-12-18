async function loadOrders() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        showModal();
        return;
    }

    try {
        const response = await fetch('/api/orders/my', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

    let html = '<div class="orders-container">';
    orders.forEach(order => {
        const statusText = {
            'PENDING': '待支付',
            'PAID': '已支付',
            'SHIPPED': '已发货',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
        }[order.status] || order.status;

        html += `
            <div class="order-item">
                <div class="order-header">
                    <span>订单号: ${order.id}</span>
                    <span class="order-status status-${order.status.toLowerCase()}">${statusText}</span>
                </div>
                <div class="order-details">
                    <p><strong>收货地址:</strong> ${order.shippingAddress || '未填写'}</p>
                    <p><strong>联系电话:</strong> ${order.phone || '未填写'}</p>
                    <p><strong>下单时间:</strong> ${new Date(order.createTime).toLocaleString('zh-CN')}</p>
                </div>
                <div class="order-items">
                    ${order.orderItems ? order.orderItems.map(item => `
                        <div class="order-product">
                            <img src="${item.product?.imageUrl || 'images/default.jpg'}" alt="${item.product?.name || '商品'}">
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
        `;
    });
    html += '</div>';
    
    ordersList.innerHTML = html;
}

loadOrders();