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

    list.innerHTML = products.map(p => `
        <div class="product-card" onclick="${admin ? `editProductFromIndex(${p.id})` : `goToProduct(${p.id})`}">
            <img src="${p.imageUrl || 'https://via.placeholder.com/280x220?text=Lenovo'}" alt="${p.name}">
            <div class="content">
                <h3>${p.name}</h3>
                <p class="model">${p.model}${p.category ? ' | ' + p.category : ''}</p>
                <div class="price">¥${p.price}</div>
                <p class="stock">库存: ${p.stock} | 销量: ${p.sales || 0}</p>
            </div>
        </div>
    `).join('');
}

function editProductFromIndex(id) {
    location.href = `product-edit.html?id=${id}`;
}

function goToProduct(id) {
    location.href = `product.html?id=${id}`;
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