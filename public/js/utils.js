export function renderNotification(text, type = 'error') {
    const msg = document.createElement('div');
    msg.className = `notification ${type === 'success' ? 'success' : 'error'}`;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    }, 1500);
}

export function generateCalendarDays(startDate = new Date(), days = 14) {
    const result = [];
    const date = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        result.push(`${year}-${month}-${day}`);

        date.setDate(date.getDate() + 1);
    }
    return result;
}
