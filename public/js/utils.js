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

export const DAY_STATUS = {
    MY_BOOKING: 'has-booking',
    FULL: 'is-full',
    DEFAULT: ''
};

export function renderCalendarGrid(days, getDayStatus = () => '') {
    if (!days || days.length === 0) return '';

    let html = `<div class="calendar-grid-wrapper">`;

    html += `<div class="calendar-grid">`;

    days.forEach(dateStr => {
        const dateObj = new Date(dateStr);

        const status = getDayStatus(dateStr);
        html += `
            <div class="calendar-day ${status}" data-date="${dateStr}">
                <div class="day-number">${dateObj.getDate()}</div>
                <div class="day-name">${dateObj.toLocaleDateString('ru-RU', { weekday: 'short' })}</div>
                ${status === DAY_STATUS.MY_BOOKING ? '<div class="booking-indicator">●</div>' : ''}
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

export function setupCalendarClicks(containerId, onDayClick) {
    const container = document.getElementById(containerId);
    if (!container)
        return;

    const days = container.querySelectorAll('.calendar-day');

    days.forEach(cell => {
        cell.addEventListener('click', () => {
            days.forEach(c => c.classList.remove('active'));
            cell.classList.add('active');

            if (onDayClick) {
                onDayClick(cell.dataset.date);
            }
        });
    });
}

