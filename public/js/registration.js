const registerForm = document.getElementById('registerForm');

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
    } catch (error) {
        renderNotification(error.message);
    }
});