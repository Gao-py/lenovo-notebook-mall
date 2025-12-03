let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');

function checkAuth() {
    const userNav = document.getElementById('userNav');
    if (token && currentUser) {
        userNav.innerHTML = `
            <span style="color: white;">欢迎, ${currentUser}</span>
            <a href="#" onclick="logout()">退出</a>
        `;
    } else {
        userNav.innerHTML = `<a href="#" onclick="openModal()">登录/注册</a>`;
    }
}

function openModal() {
    document.getElementById('authModal').classList.add('show');
}

function closeModal() {
    document.getElementById('authModal').classList.remove('show');
}

function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('resetForm').classList.add('hidden');
}

function showResetPassword() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('resetForm').classList.remove('hidden');
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (data.success) {
        token = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        alert('登录成功');
        closeModal();
        location.reload();
    } else {
        alert(data.message);
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    
    const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, phone })
    });
    
    const data = await res.json();
    if (data.success) {
        alert('注册成功,请登录');
        showLogin();
    } else {
        alert(data.message);
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
    location.href = 'index.html';
}

checkAuth();