const API_BASE = "http://localhost:3000";

async function handleResponse(res) {
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
    }

    let res_payload = await res.json();
    return res_payload;
}

export async function login(email, password) {
    const path = "/auth/login";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    return handleResponse(res);
}

export async function register(payload) {
    const path = "/auth/register";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(res);
}

const getToken = () => localStorage.getItem("token");

export async function getCurrentUser() {
    const path = "/user/me";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    });

    return handleResponse(res);
}

export async function getAnnouncements() {
    const path = "/announcements";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });

    return handleResponse(res);
}

export async function getProducts() {
    const path = "/products";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });

    return handleResponse(res);
}

export async function addProduct(payload) {
    const path = "/products/add";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}

export async function bookProduct(productId) {
    const path = "/products/book";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ product_id: productId }),
    });
    return handleResponse(res);
}

export async function createAnnouncement(payload) {
    const path = "/announcements";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
    });

    return handleResponse(res);
}

export async function getRepairCalendar(specialistId = null) {
    const path = "/repair-calendar";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return handleResponse(res);
}

export async function bookRepair(payload) {
    const path = "/repairs/book";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}

export async function cancelBooking(bookingId) {
    const path = `/repairs/bookings/${bookingId}`;
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return handleResponse(res);
}

export async function bookLaundry(machineId, date, slots) {
    const path = "/laundry/book";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
            machine_id: machineId,
            date: date,
            slots: slots,
        }),
    });
    return handleResponse(res);
}

export async function cancelLaundry(bookingId) {
    const path = `/laundry/cancel/${bookingId}`;
    const res = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return handleResponse(res);
}

export async function getAllLaundryBookings() {
    const path = "/laundry/all-data";
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    });
    return handleResponse(res);
}

export async function updateRepairStatus(bookingId, newStatus) {
    const path = `/repairs/status/${bookingId}`;
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
    });
    return handleResponse(res);
}
