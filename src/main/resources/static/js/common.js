let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');
let userRole = localStorage.getItem('userRole');
let loginCaptchaKey = '';
let regCaptchaKey = '';
let countdown = 0;

function goToCart() {
    if (requireAuth()) {
        location.href = 'cart.html';
    }
}

async function checkAuth() {
    const userNav = document.getElementById('userNav');
    const cartLink = document.querySelector('a[href="cart.html"]');
    const adminLink = document.querySelector('a[href="admin.html"]');
    const ordersLink = document.querySelector('a[href="orders.html"]');

    if (token && currentUser) {
        try {
            const res = await fetch('/api/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (data.success) {
                const user = data.data;
                const displayName = user.nickname || user.username;
                const avatarUrl = user.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22white%22/%3E%3C/svg%3E';
                let roleText = userRole === 'ADMIN' ? '(管理员)' : '(用户)';

                userNav.innerHTML = `
                    <a href="profile.html" style="color: white; display: flex; align-items: center; gap: 8px;">
                        <img src="${avatarUrl}" alt="头像" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid white;">
                        <span>欢迎, ${displayName} ${roleText}</span>
                    </a>
                    <a href="#" onclick="logout()">退出</a>
                `;
            }
        } catch (e) {
            console.error('获取用户信息失败', e);
        }

        if (userRole === 'ADMIN') {
            if (cartLink) cartLink.style.display = 'none';
            if (ordersLink) ordersLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'inline-block';
        } else {
            if (cartLink) cartLink.style.display = 'inline-block';
            if (ordersLink) ordersLink.style.display = 'inline-block';
            if (adminLink) adminLink.style.display = 'none';
        }
    } else {
        userNav.innerHTML = `<a href="#" onclick="openModal()">登录/注册</a>`;
        if (cartLink) cartLink.style.display = 'inline-block';
        if (ordersLink) ordersLink.style.display = 'inline-block';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function requireAuth() {
    if (!token) {
        alert('请先登录');
        location.href = 'index.html';
        return false;
    }
    return true;
}

async function openModal() {
    showLogin();
    document.getElementById('authModal').classList.add('show');
}

function closeModal() {
    document.getElementById('authModal').classList.remove('show');
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    refreshLoginCaptcha();
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    refreshRegCaptcha();
}

function showResetPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('resetForm').classList.remove('hidden');
}

async function refreshLoginCaptcha() {
    const res = await fetch('/api/captcha/generate');
    const data = await res.json();
    if (data.success) {
        loginCaptchaKey = data.data.key;
        document.getElementById('loginCaptchaImg').src = data.data.image;
    }
}

async function refreshRegCaptcha() {
    const res = await fetch('/api/captcha/generate');
    const data = await res.json();
    if (data.success) {
        regCaptchaKey = data.data.key;
        document.getElementById('regCaptchaImg').src = data.data.image;
    }
}

async function sendVerificationCode() {
    const email = document.getElementById('regEmail').value;
    if (!email) {
        alert('请输入邮箱');
        return;
    }

    if (countdown > 0) {
        alert('请稍后再试');
        return;
    }

    const btn = document.getElementById('sendCodeBtn');
    btn.disabled = true;

    const res = await fetch(`/api/users/send-code?email=${encodeURIComponent(email)}`, {
        method: 'POST'
    });
    const data = await res.json();

    if (data.success) {
        alert('验证码已发送到您的邮箱');
        countdown = 60;
        updateCountdown();
    } else {
        alert(data.message);
        btn.disabled = false;
    }
}

function updateCountdown() {
    const btn = document.getElementById('sendCodeBtn');
    if (countdown > 0) {
        btn.textContent = `${countdown}秒后重试`;
        countdown--;
        setTimeout(updateCountdown, 1000);
    } else {
        btn.textContent = '发送验证码';
        btn.disabled = false;
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const captchaCode = document.getElementById('loginCaptcha').value;

    if (!captchaCode) {
        alert('请输入验证码');
        return;
    }

    const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            captchaKey: loginCaptchaKey,
            captchaCode
        })
    });
    
    const data = await res.json();
    if (data.success) {
        token = data.data.token;
        userRole = data.data.role;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('userRole', userRole);
        alert('登录成功');
        closeModal();
        location.reload();
    } else {
        alert(data.message);
        refreshLoginCaptcha();
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const verificationCode = document.getElementById('regCode').value;

    if (!verificationCode) {
        alert('请输入邮箱验证码');
        return;
    }

    const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            email,
            phone,
            verificationCode
        })
    });
    
    const data = await res.json();
    alert(data.message || (data.success ? '注册成功' : '注册失败'));
    if (data.success) {
        closeModal();
        showLogin();
    }
}

async function resetPassword() {
    const email = document.getElementById('resetEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    
    const res = await fetch(`/api/user/reset-password?email=${email}&newPassword=${newPassword}`, {
        method: 'POST'
    });
    
    const data = await res.json();
    if (data.success) {
        alert('密码重置成功,请登录');
        showLogin();
    } else {
        alert(data.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    location.href = 'index.html';
}

function updateNav() {
    const userNav = document.getElementById('userNav');
    const navAdmin = document.getElementById('navAdmin');
    const navOrders = document.getElementById('navOrders');
    const navPromotions = document.getElementById('navPromotions');

    if (navAdmin) {
        navAdmin.style.display = userRole === 'ADMIN' ? 'inline-block' : 'none';
    }

    if (navOrders) {
        navOrders.style.display = token ? 'inline-block' : 'none';
    }

    if (navPromotions) {
        navPromotions.style.display = token ? 'inline-block' : 'none';
    }

    const chatLink = document.querySelector('a[href="chat.html"]');
    if (chatLink && userRole === 'ADMIN') {
        chatLink.textContent = '客户消息';
    }

    if (token && username) {
        userNav.innerHTML = `
            <span style="margin-right: 10px;">欢迎, ${username}</span>
            <a href="profile.html">个人中心</a>
            <a href="#" onclick="logout()">退出</a>
        `;
    } else {
        userNav.innerHTML = '<a href="#" onclick="showModal()">登录/注册</a>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateUserNav();
    updateNavigation();
});

checkAuth();

function updateUserNav() {
    const userNav = document.getElementById('userNav');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
        const username = parseJwt(token).sub;
        userNav.innerHTML = `
            <span>欢迎, ${username}</span>
            ${role === 'USER' ? '<a href="orders.html">我的订单</a>' : ''}
            <a href="#" onclick="logout()">退出</a>
        `;
    } else {
        userNav.innerHTML = '<a href="#" onclick="openModal()">登录/注册</a>';
    }
}

function updateNavigation() {
    const role = localStorage.getItem('role');
    const navOrders = document.getElementById('navOrders');
    const navAdmin = document.getElementById('navAdmin');

    if (role === 'ADMIN') {
        if (navOrders) navOrders.style.display = 'none';
        if (navAdmin) navAdmin.style.display = 'inline';
    } else {
        if (navOrders) navOrders.style.display = 'inline';
        if (navAdmin) navAdmin.style.display = 'none';
    }
}

updateNav();