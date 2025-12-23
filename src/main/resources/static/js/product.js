const urlParams = new URLSearchParams(window.location.search);
let productId = urlParams.get('id');
let currentProduct = null;
let sameModelProducts = [];

async function loadProduct() {
    const res = await fetch(`/api/products/${productId}`);
    const data = await res.json();
    
    if (data.success) {
        currentProduct = data.data;
        displayProduct(currentProduct);
        await loadAverageRating();
        await loadSameModelProducts(currentProduct.model);
        loadComments(productId);
    } else {
        alert('商品不存在');
        location.href = 'index.html';
    }
}

async function loadAverageRating() {
    const res = await fetch(`/api/ratings/product/${productId}/average`);
    const data = await res.json();

    if (data.success && data.data) {
        const avg = data.data;
        const fullStars = Math.floor(avg);
        const hasHalfStar = avg % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        const ratingHtml = `
            <div style="display: flex; align-items: center; gap: 10px; margin: 15px 0; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                <span style="font-size: 18px; color: #ffd700;">
                    ${'★'.repeat(fullStars)}${hasHalfStar ? '⯨' : ''}${'☆'.repeat(emptyStars)}
                </span>
                <span style="font-size: 16px; color: #666;">${avg.toFixed(1)} 分</span>
            </div>
        `;

        document.querySelector('.price').insertAdjacentHTML('afterend', ratingHtml);
    }
}

async function loadSameModelProducts(model) {
    const res = await fetch(`/api/products/model/${encodeURIComponent(model)}`);
    const data = await res.json();

    if (data.success && data.data.length > 1) {
        sameModelProducts = data.data;
        displayConfigSelector();
    }
}

function displayProduct(p) {
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
}

function displayConfigSelector() {
    const priceElement = document.querySelector('.price');
    const existingSelector = document.getElementById('configSelector');
    if (existingSelector) {
        existingSelector.remove();
    }

    const selectorHtml = `
        <div class="config-selector" id="configSelector">
            <h3>选择配置</h3>
            <div class="config-options">
                ${sameModelProducts.map(p => `
                    <div class="config-option ${p.id == productId ? 'active' : ''}" onclick="switchProduct(${p.id})">
                        <div class="config-name">${getConfigName(p)}</div>
                        <div class="config-price">¥${p.price}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    priceElement.insertAdjacentHTML('afterend', selectorHtml);
}

function getConfigName(product) {
    const parts = [];
    if (product.cpu) parts.push(product.cpu.split(' ')[0]);
    if (product.memory) parts.push(product.memory);
    if (product.storage) parts.push(product.storage);
    return parts.join(' / ') || product.name;
}

function switchProduct(newProductId) {
    productId = newProductId;
    window.history.replaceState({}, '', `product.html?id=${productId}`);
    loadProduct();
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