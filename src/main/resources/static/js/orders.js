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

async function displayOrders(orders) {
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

    const ordersHtml = await Promise.all(orders.map(async order => {
        const orderItemsHtml = await Promise.all(order.items.map(async item => {
            let ratingHtml = '';

            if (order.status === 'PAID') {
                const ratingRes = await fetch(`/api/ratings/order-item/${item.id}`);
                const ratingData = await ratingRes.json();

                if (ratingData.success && ratingData.data) {
                    const rating = ratingData.data;
                    ratingHtml = `
                        <div class="rating-section">
                            <div class="rating-display">
                                <span>您的评分：</span>
                                <span class="stars">${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}</span>
                            </div>
                            ${rating.comment ? `<p style="margin-top: 8px; color: #666;">${rating.comment}</p>` : ''}
                        </div>
                    `;
                } else {
                    ratingHtml = `
                        <div class="rating-section">
                            <div style="font-weight: bold; margin-bottom: 10px;">为此商品评分</div>
                            <div class="star-rating" id="stars-${item.id}">
                                ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" onclick="selectRating(${item.id}, ${i})">☆</span>`).join('')}
                            </div>
                            <textarea class="rating-comment" id="comment-${item.id}" placeholder="写下您的评价（可选）" rows="3"></textarea>
                            <button class="btn-primary" onclick="submitRating(${item.id})">提交评分</button>
                        </div>
                    `;
                }
            }

            return `
                <div class="order-product">
                    <img src="${item.product?.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.product?.name || '商品'}">
                    <div class="product-info">
                        <h4>${item.product?.name || '商品'}</h4>
                        <p>数量: ${item.quantity}</p>
                        <p class="price">¥${item.price ? item.price.toFixed(2) : '0.00'}</p>
                    </div>
                </div>
                ${ratingHtml}
            `;
        }));

        return `
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
                    ${orderItemsHtml.join('')}
                </div>
                <div class="order-footer">
                    <span class="total-price">订单总额: ¥${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        `;
    }));

    ordersList.innerHTML = '<div class="orders-container">' + ordersHtml.join('') + '</div>';
}

let selectedRatings = {};

function selectRating(orderItemId, rating) {
    selectedRatings[orderItemId] = rating;
    const stars = document.querySelectorAll(`#stars-${orderItemId} .star`);
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
}

async function submitRating(orderItemId) {
    const rating = selectedRatings[orderItemId];
    if (!rating) {
        alert('请选择评分');
        return;
    }

    const comment = document.getElementById(`comment-${orderItemId}`).value;
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                orderItemId: orderItemId,
                rating: rating,
                comment: comment
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('评分成功');
            loadOrders();
        } else {
            alert('评分失败: ' + result.message);
        }
    } catch (error) {
        console.error('评分错误:', error);
        alert('评分失败');
    }
}

loadOrders();