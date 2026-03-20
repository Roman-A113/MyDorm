require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

function generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

async function getUserById(id) {
    const { rows } = await db.query(
        `SELECT id, name, email, role, profession, room 
         FROM users
         WHERE id = ${id}`);

    if (rows.length === 0) {
        throw new Error(`Пользователь c id ${id} не найден`);
    }
    return rows[0];
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

app.post('/auth/register', async (req, res) => {
    const { name, email, password, role, profession, room } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Некорректные данные' });

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Пользователь уже существует' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
        'INSERT INTO users (name, email, password_hash, role, profession, room) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role',
        [name, email, hash, role, profession || null, room || null]
    );
    const token = generateToken(result.rows[0]);
    res.json({ token, user: result.rows[0] });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db.query(`SELECT id, name, email, role, password_hash FROM users WHERE email = '${email}'`);
    const user = rows[0];
    if (!user)
        return res.status(401).json({ error: 'Неверные учетные данные' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
        return res.status(401).json({ error: 'Неверные учетные данные' });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/user/me', authMiddleware, async (req, res) => {
    const user = await getUserById(req.user.id);
    res.json(user);
});

app.get('/mainmenu', authMiddleware, async (req, res) => {
    const [laundry, shifts, events, notices] = await Promise.all([
        db.query("SELECT id, slot_date, slot_time, machine_number, max_students, (max_students - COALESCE((SELECT COUNT(*) FROM laundry_bookings lb WHERE lb.slot_id=ls.id AND status = 'booked'),0)) AS free_spots FROM laundry_slots ls ORDER BY slot_date, slot_time"),
        db.query('SELECT s.id, s.date, s.from_time AS from, s.to_time AS to, s.status, u.name AS worker_name FROM shifts s JOIN users u ON u.id = s.worker_id ORDER BY s.date, s.from_time'),
        db.query("SELECT e.id, e.title, e.description, e.date_start, e.date_end, u.name AS author_name FROM events e JOIN users u ON u.id = e.author_id WHERE e.status = 'published' ORDER BY e.date_start DESC"),
        db.query('SELECT id, title, body, published_at FROM notices WHERE is_public = TRUE ORDER BY published_at DESC LIMIT 20'),
    ]);

    res.json({ laundry: laundry.rows, shifts: shifts.rows, events: events.rows, notices: notices.rows });
});


async function ensureTodaySlots() {
    const today = new Date().toISOString().split('T')[0];
    
    await db.query(
        `DELETE FROM laundry_slots
        WHERE slot_date < $1
    `, [today]);
    
    const { rows } = await db.query(
        'SELECT id FROM laundry_slots WHERE slot_date = $1',
        [today]
    );

    if (rows.length === 0) {
        for (let hour = 8; hour < 24; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            await db.query(
                'INSERT INTO laundry_slots (slot_date, slot_time) VALUES ($1, $2)',
                [today, time]
            );
        }
    }
}

app.get('/laundry', authMiddleware, async (req, res) => {
    await ensureTodaySlots();
    const { rows } = await db.query(
        `SELECT
	        laundry_slots.id,
            slot_date::TEXT AS slot_date,
            slot_time,
            max_students - COUNT(user_id) AS free_spots
        FROM laundry_slots
        LEFT JOIN laundry_bookings ON laundry_slots.id = laundry_bookings.slot_id
        GROUP BY laundry_slots.id, max_students
        ORDER BY slot_date, slot_time;`);
    res.json(rows);
});

app.post('/laundry/:id/book', authMiddleware, async (req, res) => {
    const slotId = Number(req.params.id);
    const userId = req.user.id;

    const existing = await db.query(
        'SELECT id FROM laundry_bookings WHERE user_id = $1',
        [userId]
    );

    if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Вы уже записаны на стирку' });
    }

    await db.query('INSERT INTO laundry_bookings (slot_id, user_id) VALUES ($1,$2)', [slotId, userId]);
    res.json({ status: 'ok' });
});

app.get('/shifts', authMiddleware, async (req, res) => {
    const { rows } = await db.query('SELECT s.id, s.worker_id, s.date, s.from_time, s.to_time, s.status, u.name AS worker_name FROM shifts s JOIN users u ON u.id = s.worker_id ORDER BY s.date, s.from_time');
    res.json(rows);
});

app.post('/shifts', authMiddleware, async (req, res) => {
    if (req.user.role !== 'worker' && req.user.role !== 'admin') return res.status(403).json({ error: 'Требуется роль работника или админа' });
    const { date, from_time, to_time, capacity } = req.body;
    if (!date || !from_time || !to_time || !capacity) return res.status(400).json({ error: 'Заполните обязательные поля' });

    const { rows } = await db.query('INSERT INTO shifts (worker_id, date, from_time, to_time, capacity, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [req.user.id, date, from_time, to_time, capacity, 'open']);
    res.json(rows[0]);
});

app.get('/events', authMiddleware, async (req, res) => {
    const { rows } = await db.query('SELECT e.id, e.title, e.description, e.date_start, e.date_end, e.max_participants, u.name AS author_name FROM events e JOIN users u ON u.id = e.author_id WHERE e.status = $1 ORDER BY e.date_start DESC', ['published']);
    res.json(rows);
});

app.post('/events', authMiddleware, async (req, res) => {
    const { title, description, date_start, date_end, max_participants } = req.body;
    if (!title || !date_start || !date_end) return res.status(400).json({ error: 'Заполните обязательные поля' });

    const { rows } = await db.query('INSERT INTO events (author_id, title, description, date_start, date_end, max_participants, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.user.id, title, description || null, date_start, date_end, max_participants || null, 'published']);
    res.json(rows[0]);
});

app.post('/events/:id/join', authMiddleware, async (req, res) => {
    const eventId = Number(req.params.id);
    const event = await db.query('SELECT max_participants FROM events WHERE id = $1', [eventId]);
    if (!event.rowCount) return res.status(404).json({ error: 'Событие не найдено' });

    if (event.rows[0].max_participants) {
        const count = await db.query('SELECT COUNT(*) FROM event_participants WHERE event_id = $1', [eventId]);
        if (Number(count.rows[0].count) >= event.rows[0].max_participants) return res.status(409).json({ error: 'Мероприятие заполнено' });
    }

    await db.query('INSERT INTO event_participants (event_id, user_id, role, signed_at) VALUES ($1,$2,$3,NOW())', [eventId, req.user.id, 'participant']);
    res.json({ status: 'ok' });
});

app.get('/notices', authMiddleware, async (req, res) => {
    const { rows } = await db.query('SELECT id, title, body, published_at FROM notices WHERE is_public = true ORDER BY published_at DESC');
    res.json(rows);
});

app.post('/notices', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только админ' });
    const { title, body, is_public } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Заполните поля' });

    const { rows } = await db.query('INSERT INTO notices (author_id, title, body, is_public, published_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *', [req.user.id, title, body, is_public ?? true]);
    res.json(rows[0]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});