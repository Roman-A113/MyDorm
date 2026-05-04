import { renderNotification } from './utils.js';
import { login } from './api.js';

const loginForm = document.getElementById('loginForm');
const loginButton = loginForm.querySelector('button');
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        loginButton.disabled = true;
        const result = await login(email, password);
        localStorage.setItem('token', result.token);
        window.location.href = 'mainmenu.html';
    } catch (error) {
        loginButton.disabled = false;
        console.log(error);
        renderNotification(error.message);
    }
});

window.addEventListener('pageshow', (e) => {
    loginButton.disabled = false;
});
