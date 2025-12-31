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
            let ratingHtml = '';

            if (order.status === 'PAID') {
                const rating = ratingsMap[item.id];

                if (rating) {
                    ratingHtml = `
                        <div class="rating-section">
                            <div class="rating-display">
                                <span>您的评分：</span>
                                <span class="stars">${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}</span>
                            </div>
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
                            <div style="margin: 15px 0;">
                                <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">上传图片（可选，最多3张）</label>
                                <input type="file" id="images-${item.id}" accept="image/*" multiple style="display: none;" onchange="handleImageSelect(${item.id}, event)">
                                <button type="button" onclick="document.getElementById('images-${item.id}').click()" style="padding: 8px 16px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">选择图片</button>
                                <div id="preview-${item.id}" style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;"></div>
                            </div>
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
        }).join('');

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
                </div>
            </div>
        `;
    }).join('');

    ordersList.innerHTML = '<div class="orders-container">' + ordersHtml + '</div>';
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
            delete selectedImages[orderItemId];
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