import { renderNotification } from './utils.js';
import { register, login } from './api.js';

const registerForm = document.getElementById('registerForm');

const registerButton = registerForm.querySelector('button');
registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(registerForm);
    const payload = {
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: 'student',
    };

    try {
        registerButton.disabled = true;
        await register(payload);
        registerForm.reset();
        const result = await login(payload.email, payload.password);
        localStorage.setItem('token', result.token);
        window.location.href = 'mainmenu.html';
        registerButton.disabled = false;
    } catch (error) {
        console.log(error);
        renderNotification(error.message);
    }
});
