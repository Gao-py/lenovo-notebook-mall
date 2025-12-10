async function loadProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    displayProducts(data.data);
}

async function searchProducts() {
    const model = document.getElementById('searchModel').value;
    const res = await fetch(`/api/products/search?model=${model}`);
    const data = await res.json();
    displayProducts(data.data);
}

async function searchByPrice() {
    const min = document.getElementById('minPrice').value || 0;
    const max = document.getElementById('maxPrice').value || 999999;
    const res = await fetch(`/api/products/price-range?min=${min}&max=${max}`);
    const data = await res.json();
    displayProducts(data.data);
}

function displayProducts(products) {
    const list = document.getElementById('productList');
    if (!products || products.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:40px;">暂无商品</p>';
        return;
    }
    list.innerHTML = products.map(p => `
        <div class="product-card" onclick="goToProduct(${p.id})">
            <img src="${p.imageUrl || 'https://via.placeholder.com/250x200?text=Lenovo'}" alt="${p.name}">
            <div class="content">
                <h3>${p.name}</h3>
                <p class="model">${p.model}</p>
                <div class="price">¥${p.price}</div>
                <p class="stock">库存: ${p.stock}</p>
                <button onclick="event.stopPropagation(); addToCartQuick(${p.id})">加入购物车</button>
            </div>
        </div>
    `).join('');
}

function goToProduct(id) {
    location.href = `product.html?id=${id}`;
}

async function addToCartQuick(productId) {
    if (!requireAuth()) return;

    const res = await fetch(`/api/cart/add?productId=${productId}&quantity=1`, {
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

loadProducts();