const API_BASE = 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');

const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

async function apiRequest(path, options = {}) {
    const params = {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...(options.headers || {}),
        },
        ...options,
    };

    if (options.body && typeof options.body !== 'string') {
        params.body = JSON.stringify(options.body);
    }

    const res = await fetch(`${API_BASE}${path}`, params);

    let payload = await res.json();
    if (!res.ok) {
        throw new Error(payload.error);
    }

    return payload;
}

async function login(email, password) {
    return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

async function register(payload) {
    return apiRequest('/auth/register', { method: 'POST', body: payload });
}

async function getCurrentUser() {
    return apiRequest('/user/me', { method: 'GET' });
}

async function getMainMenuData() {
    return apiRequest('/mainmenu', { method: 'GET' });
}

async function getLaundrySlots() {
    return apiRequest('/laundry', { method: 'GET' });
}

async function bookLaundry(slotId) {
    return apiRequest(`/laundry/${slotId}/book`, { method: 'POST' });
}

async function createLaundrySlot(payload) {
    return apiRequest('/laundry', { method: 'POST', body: payload });
}

async function getShifts() {
    return apiRequest('/shifts', { method: 'GET' });
}

async function createShift(payload) {
    return apiRequest('/shifts', { method: 'POST', body: payload });
}

async function getEvents() {
    return apiRequest('/events', { method: 'GET' });
}

async function createEvent(payload) {
    return apiRequest('/events', { method: 'POST', body: payload });
}

async function joinEvent(eventId) {
    return apiRequest(`/events/${eventId}/join`, { method: 'POST' });
}

async function getNotices() {
    return apiRequest('/notices', { method: 'GET' });
}

async function createNotice(payload) {
    return apiRequest('/notices', { method: 'POST', body: payload });
}
