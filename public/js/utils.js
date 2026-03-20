function renderNotification(text, type = 'error') {
    const msg = document.createElement('div');
    msg.className = `notification ${type === 'success' ? 'success' : 'error'}`;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    }, 1500);
}