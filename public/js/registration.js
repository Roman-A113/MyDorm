import { renderNotification } from './utils.js';
import { register } from './api.js';

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
        registerForm.reset();
        window.location.href = 'login.html';
    } catch (error) {
        console.log(error);
        renderNotification(error.message);
    }
});