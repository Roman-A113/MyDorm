import { getLaundrySlots, bookLaundry, cancelLaundry } from './api.js';
import { renderNotification, renderCalendarGrid, generateCalendarDays, setupCalendarClicks } from './utils.js';

const CALENDAR_CONTAINER_ID = 'calendar-content-laundry';

export async function renderLaundry() {
    const panel = document.getElementById(CALENDAR_CONTAINER_ID);
    const daysData = generateCalendarDays();
    panel.innerHTML += `${renderCalendarGrid(daysData)}`;
    setupCalendarClicks(CALENDAR_CONTAINER_ID);
}