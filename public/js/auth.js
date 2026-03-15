const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const result = await login(email, password);
        localStorage.setItem('dorm6_token', result.token);
        window.location.href = 'dashboard.html';
    } catch (error) {
        authMessage.textContent = 'Не удалось войти: ' + error.message;
    }
});

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(registerForm);
    const payload = {
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
    };

    try {
        await register(payload);
        authMessage.textContent = 'Регистрация прошла успешно, выполните вход.';
        authMessage.style.color = '#2f855a';
        registerForm.reset();
    } catch (err) {
        authMessage.style.color = '#e53e3e';
        authMessage.textContent = 'Ошибка регистрации: ' + err.message;
    }
});
