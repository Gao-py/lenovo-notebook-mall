let allProducts = [];
let currentSlide = 0;
let slideInterval;
let currentCategory = '';

function isAdmin() {
    return localStorage.getItem('userRole') === 'ADMIN';
}

async function loadProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    allProducts = data.data || [];
    displayProducts(allProducts);
}

async function applyFilters() {
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    const sortBy = document.getElementById('sortBy').value;

    let url = '/api/products?';
    if (currentCategory) url += `category=${currentCategory}&`;
    if (minPrice) url += `minPrice=${minPrice}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;
    if (sortBy) url += `sortBy=${sortBy}`;

    const res = await fetch(url);
    const data = await res.json();
    displayProducts(data.data || []);
}

async function searchProducts() {
    const model = document.getElementById('searchModel').value;
    if (!model) {
        loadProducts();
        return;
    }
    const filtered = allProducts.filter(p =>
        p.model.toLowerCase().includes(model.toLowerCase()) ||
        p.name.toLowerCase().includes(model.toLowerCase())
    );
    displayProducts(filtered);
}

async function filterByCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    currentCategory = category === 'all' ? '' : category;

    if (category === 'all') {
        loadProducts();
    } else {
        const res = await fetch(`/api/products/category/${category}`);
        const data = await res.json();
        displayProducts(data.data || []);
    }
}

async function displayProducts(products) {
    const list = document.getElementById('productList');
    if (!products || products.length === 0) {
        list.innerHTML = '<p style="text-align:center;padding:40px;grid-column:1/-1;">暂无商品</p>';
        return;
    }

    const admin = isAdmin();

    const productsWithRatings = await Promise.all(products.map(async p => {
        const ratingRes = await fetch(`/api/ratings/product/${p.id}/average`);
        const ratingData = await ratingRes.json();
        return {
            ...p,
            avgRating: ratingData.success && ratingData.data ? ratingData.data : null
        };
    }));

    list.innerHTML = productsWithRatings.map(p => {
        let ratingHtml = '';
        if (p.avgRating) {
            const fullStars = Math.floor(p.avgRating);
            const emptyStars = 5 - fullStars;
            ratingHtml = `
                <div style="display: flex; align-items: center; gap: 5px; margin: 8px 0;">
                    <span style="color: #ffd700; font-size: 20px;">${'★'.repeat(fullStars)}${'☆'.repeat(emptyStars)}</span>
                    <span style="color: #666; font-size: 14px;">${p.avgRating.toFixed(1)}</span>
                </div>
            `;
        }

        // 使用 SVG 占位图替代 via.placeholder.com
        const placeholderImage = p.imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="280" height="220"%3E%3Crect width="280" height="220" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ELenovo%3C/text%3E%3C/svg%3E';

        return `
            <div class="product-card" onclick="${admin ? `editProductFromIndex(${p.id})` : `goToProduct(${p.id})`}">
                <img src="${placeholderImage}" alt="${p.name}">
                <div class="content">
                    <h3>${p.name}</h3>
                    <p class="model">${p.model}${p.category ? ' | ' + p.category : ''}</p>
                    ${ratingHtml}
                    <div class="price">${p.price}</div>
                    <p class="stock">库存: ${p.stock} | 销量: ${p.sales || 0}</p>
                </div>
            </div>
        `;
    }).join('');
}

function editProductFromIndex(id) {
    location.href = `product-edit.html?id=${id}`;
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
    alert(data.success ? '已加入购物车' : data.message);
}

function showSlide(n) {
    const slides = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.carousel-dot');

    if (n >= slides.length) currentSlide = 0;
    if (n < 0) currentSlide = slides.length - 1;

    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    currentSlide++;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide--;
    showSlide(currentSlide);
}

function goToSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
}

function startCarousel() {
    slideInterval = setInterval(nextSlide, 5000);
}

function stopCarousel() {
    clearInterval(slideInterval);
}

document.querySelector('.carousel').addEventListener('mouseenter', stopCarousel);
document.querySelector('.carousel').addEventListener('mouseleave', startCarousel);

loadProducts();
startCarousel();

// 在文件末尾添加
document.addEventListener('DOMContentLoaded', function() {
    // 为所有轮播图添加错误处理
    document.querySelectorAll('.carousel-item img').forEach(img => {
        img.onerror = function() {
            // 如果图片加载失败，隐藏图片，只显示渐变背景
            this.style.display = 'none';
        };
    });
});