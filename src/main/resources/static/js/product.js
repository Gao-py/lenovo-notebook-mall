const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

async function loadProduct() {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();
    
    if (data.success) {
        const p = data.data;
        document.getElementById('productImg').src = p.imageUrl || 'https://via.placeholder.com/500x400?text=Lenovo';
        document.getElementById('productName').textContent = p.name;
        document.getElementById('productModel').textContent = p.model;
        document.getElementById('productPrice').textContent = '¥' + p.price;
        document.getElementById('cpu').textContent = p.cpu || '暂无';
        document.getElementById('memory').textContent = p.memory || '暂无';
        document.getElementById('storage').textContent = p.storage || '暂无';
        document.getElementById('display').textContent = p.display || '暂无';
        document.getElementById('graphics').textContent = p.graphics || '暂无';
        document.getElementById('description').textContent = p.description || '暂无描述';
        document.getElementById('stock').textContent = p.stock;
        document.getElementById('sales').textContent = p.sales;
    } else {
        alert('商品不存在');
        location.href = 'index.html';
    }
}

async function addToCart() {
    if (!requireAuth()) return;
    
    const quantity = document.getElementById('quantity').value;
    const res = await fetch(`/api/cart/add?productId=${productId}&quantity=${quantity}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const data = await res.json();
    if (data.success) {
        alert('已加入购物车');
    } else {
        alert(data.message);
    }
}

function buyNow() {
    if (!requireAuth()) return;
    addToCart().then(() => {
        location.href = 'cart.html';
    });
}

loadProduct();