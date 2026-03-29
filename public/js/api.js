const API_BASE = 'http://localhost:3000';


async function handleResponse(res) {
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    let res_payload = await res.json();
    return res_payload;
}

async function login(email, password) {
    const path = '/auth/login';
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    return handleResponse(res);
}

async function register(payload) {
    const path = '/auth/register';
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(res);
}

const getToken = () => localStorage.getItem('token');

async function getCurrentUser() {
    const path = '/user/me';
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
        }
    });

    return handleResponse(res);
}

async function getMainMenuData() {
    const path = '/mainmenu';
    const res = await fetch(`${API_BASE}${path}`, { method: 'GET' });

    return handleResponse(res);
}

async function getLaundrySlots() {
    const path = '/laundry';
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    return handleResponse(res);
}

async function bookLaundry(slotId) {
    const path = `/laundry/${slotId}/book`;
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    return handleResponse(res);
}

async function cancelLaundry(slotId) {
    const path = `/laundry/${slotId}/cancel`;
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    return handleResponse(res);
}

async function createLaundrySlot(payload) {
    const path = '/laundry';
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    return handleResponse(res);
}
