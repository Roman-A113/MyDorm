export const LAUNDRY_TIME_SLOTS = [
    "08:00-08:30",
    "08:30-09:00",
    "09:00-09:30",
    "09:30-10:00",
    "10:00-10:30",
    "10:30-11:00",
    "11:00-11:30",
    "11:30-12:00",
    "12:00-12:30",
    "12:30-13:00",
    "13:00-13:30",
    "13:30-14:00",
    "14:00-14:30",
    "14:30-15:00",
    "15:00-15:30",
    "15:30-16:00",
    "16:00-16:30",
    "16:30-17:00",
    "17:00-17:30",
    "17:30-18:00",
    "18:00-18:30",
    "18:30-19:00",
    "19:00-19:30",
    "19:30-20:00",
    "20:00-20:30",
    "20:30-21:00",
];

export const LAUNDRY_MACHINES = [
    { id: 1, name: "Машинка №1" },
    { id: 2, name: "Машинка №2" },
    { id: 3, name: "Машинка №3" },
    { id: 4, name: "Машинка №4" },
    { id: 5, name: "Машинка №5" },
    { id: 6, name: "Машинка №6" },
    { id: 7, name: "Машинка №7" },
];

export const REPAIR_TIME_BLOCKS = ["09-12", "12-15", "15-18", "18-21"];

export const REPAIR_SPECIALISTS = [
    { id: "plumber", name: "Сантехник" },
    { id: "electrician", name: "Электрик" },
    { id: "carpenter", name: "Плотник" },
];

export const MAX_REPAIR_BOOKINGS = 2;

export const DAY_STATUS = {
    MY_BOOKING: "has-booking",
    FULL: "is-full",
    DEFAULT: "",
};

export function renderNotification(text, type = "error") {
    const msg = document.createElement("div");
    msg.className = `notification ${type === "success" ? "success" : "error"}`;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.style.opacity = "0";
        setTimeout(() => msg.remove(), 300);
    }, 1500);
}

export function generateCalendarDays(startDate = new Date(), days = 14) {
    const result = [];
    const date = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        result.push(`${year}-${month}-${day}`);

        date.setDate(date.getDate() + 1);
    }
    return result;
}

export function renderCalendarGrid(days, getDayStatus = () => "") {
    if (!days || days.length === 0) return "";

    let html = `<div class="calendar-grid-wrapper">`;

    html += `<div class="calendar-grid">`;

    days.forEach((dateStr) => {
        const dateObj = new Date(dateStr);

        const status = getDayStatus(dateStr);
        html += `
            <div class="calendar-day ${status}" data-date="${dateStr}">
                <div class="day-number">${dateObj.getDate()}</div>
                <div class="day-name">${dateObj.toLocaleDateString("ru-RU", { weekday: "short" })}</div>
                ${status === DAY_STATUS.MY_BOOKING ? '<div class="booking-indicator">●</div>' : ""}
            </div>
        `;
    });

    html += `</div></div>`;
    return html;
}

export function setupCalendarClicks(containerId, onDayClick) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const days = container.querySelectorAll(".calendar-day");

    days.forEach((cell) => {
        cell.addEventListener("click", () => {
            days.forEach((c) => c.classList.remove("active"));
            cell.classList.add("active");

            if (onDayClick) {
                onDayClick(cell.dataset.date);
            }
        });
    });
}
