let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');
let userRole = localStorage.getItem('userRole');
let loginCaptchaKey = '';
let regCaptchaKey = '';

function checkAuth() {
    const userNav = document.getElementById('userNav');
    const cartLink = document.querySelector('a[href="cart.html"]');
    const adminLink = document.querySelector('a[href="admin.html"]');

    if (token && currentUser) {
        let roleText = userRole === 'ADMIN' ? '(管理员)' : '(用户)';
        userNav.innerHTML = `
            <a href="profile.html" style="color: white;">欢迎, ${currentUser} ${roleText}</a>
            <a href="#" onclick="logout()">退出</a>
        `;

        if (userRole === 'ADMIN') {
            if (cartLink) cartLink.style.display = 'none';
            if (adminLink) adminLink.style.display = 'inline-block';
        } else {
            if (cartLink) cartLink.style.display = 'inline-block';
            if (adminLink) adminLink.style.display = 'none';
        }
    } else {
        userNav.innerHTML = `<a href="#" onclick="openModal()">登录/注册</a>`;
        if (cartLink) cartLink.style.display = 'inline-block';
        if (adminLink) adminLink.style.display = 'none';
    }
}

function requireAuth() {
    if (!token) {
        openModal();
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

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const captchaCode = document.getElementById('loginCaptcha').value;

    if (!captchaCode) {
        alert('请输入验证码');
        return;
    }

    const res = await fetch('/api/user/login', {
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
    const captchaCode = document.getElementById('regCaptcha').value;

    if (!captchaCode) {
        alert('请输入验证码');
        return;
    }

    const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            email,
            phone,
            captchaKey: regCaptchaKey,
            captchaCode
        })
    });
    
    const data = await res.json();
    if (data.success) {
        alert('注册成功,请登录');
        showLogin();
    } else {
        alert(data.message);
        refreshRegCaptcha();
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

checkAuth();