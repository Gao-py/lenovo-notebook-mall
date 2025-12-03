if (!token) {
    alert('请先登录');
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

function checkout() {
    alert('结算功能开发中...');
}

loadCart();