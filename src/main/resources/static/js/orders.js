// 在文件开头修改
const token = localStorage.getItem('token');
if (!token) {
    throw new Error('未登录');
}

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

        if (!response.ok) {
            throw new Error('请求失败');
        }

        const result = await response.json();

        if (result.success) {
            if (result.data.orders && result.data.ratings) {
                displayOrders(result.data.orders, result.data.ratings);
            } else if (Array.isArray(result.data)) {
                displayOrders(result.data, {});
            } else {
                console.error('未知的数据结构:', result.data);
                displayOrders([], {});
            }
        } else {
            console.error('订单加载失败:', result.message);
            displayOrders([], {});
        }
    } catch (error) {
        console.error('加载订单错误:', error);
        displayOrders([], {});
    }
}

async function displayOrders(orders, ratingsMap) {
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

    const ordersHtml = orders.map(order => {
        const orderItemsHtml = order.items.map(item => {
            const rating = ratingsMap[item.id];
            const ratingBtn = order.status === 'PAID' ?
                (rating ?
                    `<button style="padding: 8px 16px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 6px; cursor: default; font-size: 14px; font-weight: 500; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); white-space: nowrap; width: auto; display: inline-block;" disabled>
                        已评价
                    </button>` :
                    `<button onclick="showRatingModal(${item.id}, '${item.product?.name || '商品'}')" style="padding: 8px 16px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s; box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3); white-space: nowrap; width: auto; display: inline-block;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(255, 107, 107, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(255, 107, 107, 0.3)'">
                        评价商品
                    </button>`
                ) : '';

            return `
                <div class="order-product">
                    <img src="${item.product?.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.product?.name || '商品'}">
                    <div class="product-info">
                        <h4>${item.product?.name || '商品'}</h4>
                        <p>数量: ${item.quantity}</p>
                        <p class="price">¥${item.price ? item.price.toFixed(2) : '0.00'}</p>
                    </div>
                    ${ratingBtn}
                </div>
            `;
        }).join('');

        const refundBtn = order.status === 'PAID' ?
            `<button class="btn-primary" onclick="refundOrder(${order.id})" style="margin-left: 15px; background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);">申请退款</button>` : '';

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
                    ${orderItemsHtml}
                </div>
                <div class="order-footer">
                    <span class="total-price">订单总额: ¥${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                    <button class="btn-primary" onclick="buyAgain(${order.id})" style="margin-left: 15px;">再买一单</button>
                    ${refundBtn}
                </div>
            </div>
        `;
    }).join('');

    ordersList.innerHTML = '<div class="orders-container">' + ordersHtml + '</div>';
}

function showRatingModal(orderItemId, productName) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'ratingModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeRatingModal()">&times;</span>
            <h2>评价商品</h2>
            <p style="color: #666; margin-bottom: 20px;">${productName}</p>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">评分</label>
                <div class="star-rating" id="stars-${orderItemId}">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" onclick="selectRating(${orderItemId}, ${i})">☆</span>`).join('')}
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">评价内容</label>
                <textarea class="rating-comment" id="comment-${orderItemId}" placeholder="写下您的评价（可选）" rows="4"></textarea>
            </div>
            
            <div style="margin: 20px 0;">
                <label style="display: block; margin-bottom: 10px; font-weight: bold;">上传图片（可选，最多3张）</label>
                <input type="file" id="images-${orderItemId}" accept="image/*" multiple style="display: none;" onchange="handleImageSelect(${orderItemId}, event)">
                <button type="button" onclick="document.getElementById('images-${orderItemId}').click()" style="padding: 8px 16px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">选择图片</button>
                <div id="preview-${orderItemId}" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;"></div>
            </div>
            
            <button class="btn-primary" onclick="submitRating(${orderItemId})" style="width: 100%; margin-top: 20px;">提交评价</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) modal.remove();
}

async function buyAgain(orderId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        return;
    }

    try {
        const response = await fetch('/api/orders/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success) {
            alert('获取订单信息失败');
            return;
        }

        const orders = result.data.orders || result.data;
        const order = orders.find(o => o.id === orderId);

        if (!order || !order.items) {
            alert('订单不存在');
            return;
        }

        for (const item of order.items) {
            await fetch(`/api/cart/add?productId=${item.product.id}&quantity=${item.quantity}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        alert('商品已加入购物车');
        location.href = 'cart.html';
    } catch (error) {
        console.error('再买一单失败:', error);
        alert('操作失败，请重试');
    }
}

async function refundOrder(orderId) {
    if (!confirm('确定要申请退款吗？退款后订单将被取消,商品库存将恢复。')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('请先登录');
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}/refund`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (result.success) {
            alert('退款申请成功，订单已取消');
            loadOrders();
        } else {
            alert('退款失败: ' + result.message);
        }
    } catch (error) {
        console.error('退款失败:', error);
        alert('操作失败，请重试');
    }
}

let selectedRatings = {};
let selectedImages = {};

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

function handleImageSelect(orderItemId, event) {
    const files = Array.from(event.target.files).slice(0, 3);
    const previewDiv = document.getElementById(`preview-${orderItemId}`);
    previewDiv.innerHTML = '';

    selectedImages[orderItemId] = [];

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            selectedImages[orderItemId].push(e.target.result);
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid #e0e0e0;';
            previewDiv.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

async function submitRating(orderItemId) {
    const rating = selectedRatings[orderItemId];
    if (!rating) {
        alert('请选择评分');
        return;
    }

    const comment = document.getElementById(`comment-${orderItemId}`).value;
    const images = selectedImages[orderItemId] ? selectedImages[orderItemId].join(',') : null;
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
                comment: comment,
                images: images
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('评分成功');
            closeRatingModal();
            delete selectedImages[orderItemId];
            delete selectedRatings[orderItemId];
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