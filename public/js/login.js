const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const result = await login(email, password);
        localStorage.setItem('token', result.token);
        window.location.href = 'mainmenu.html';
    } catch (error) {
        renderNotification(error.message);
    }
});
