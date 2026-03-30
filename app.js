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

app.post('/auth/register', async (req, res) => {
    const { name, email, password, role, room } = req.body;
    if (!name || !email || !password || !role)
        return res.status(400).send('Некорректные данные');

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length)
        return res.status(409).send('Данный пользователь уже существует');

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
        'INSERT INTO users (name, email, password_hash, role, room) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
        [name, email, hash, role, room || null]
    );
    const token = generateToken(result.rows[0]);
    res.json({ token, user: result.rows[0] });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { rows } = await db.query(`SELECT id, name, email, role, password_hash FROM users WHERE email = '${email}'`);
    const user = rows[0];
    if (!user)
        return res.status(401).send('Такого пользователя не существует');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
        return res.status(401).send('Неверный пароль');

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});


async function getUserById(id) {
    const { rows } = await db.query(
        `SELECT id, name, email, role, room 
         FROM users
         WHERE id = ${id}`);

    if (rows.length === 0) {
        throw new Error(`Пользователь c id ${id} не найден`);
    }
    return rows[0];
}


function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth)
        return res.status(401).send('Unauthorized');
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).send('Invalid token');
    }
}

app.get('/user/me', authMiddleware, async (req, res) => {
    const user = await getUserById(req.user.id);
    res.json(user);
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
            slot_time,
            max_students - COUNT(user_id) AS free_spots,
            EXISTS(
                SELECT 1
                FROM laundry_bookings
                WHERE laundry_bookings.slot_id = laundry_slots.id
                AND laundry_bookings.user_id = $1
            ) AS is_booked_by_user
        FROM laundry_slots
        LEFT JOIN laundry_bookings ON laundry_slots.id = laundry_bookings.slot_id
        GROUP BY laundry_slots.id, max_students
        ORDER BY slot_date, slot_time;`, [req.user.id]);
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
        return res.status(409).send('Вы уже записаны на стирку');
    }

    await db.query('INSERT INTO laundry_bookings (slot_id, user_id) VALUES ($1,$2)', [slotId, userId]);
    res.json({ status: 'ok' });
});

app.delete('/laundry/:id/cancel', authMiddleware, async (req, res) => {
    const slotId = Number(req.params.id);
    const userId = req.user.id;

    try {
        const existing = await db.query(
            'SELECT id FROM laundry_bookings WHERE slot_id = $1 AND user_id = $2',
            [slotId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        await db.query(
            'DELETE FROM laundry_bookings WHERE slot_id = $1 AND user_id = $2',
            [slotId, userId]
        );

        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Ошибка отмены брони:', error);
        return res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/announcements', authMiddleware, async (req, res) => {
    const { rows } = await db.query('SELECT id, title, body, published_at FROM announcements ORDER BY published_at DESC');
    res.json(rows);
});

app.post('/announcements', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Только админ' });
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Заполните поля' });

    const { rows } = await db.query('INSERT INTO announcements (title, body, author_id, published_at) VALUES ($1,$2,$3,NOW()) RETURNING *', [title, body, req.user.id]);
    res.json(rows[0]);
});

app.get('/repairs/calendar', authMiddleware, async (req, res) => {
    try {
        // Период: сегодня + 14 дней
        const start = new Date().toISOString().split('T')[0];
        const end = new Date();
        end.setDate(end.getDate() + 14);
        const endStr = end.toISOString().split('T')[0];

        // Получаем все активные записи на период
        const { rows } = await db.query(`
            SELECT 
                slot_date::TEXT AS slot_date,
                time_block,
                student_id
            FROM repair_bookings
            WHERE slot_date BETWEEN $1 AND $2
              AND status IN ('pending', 'accepted')
            ORDER BY slot_date, time_block
        `, [start, endStr]);

        // Группируем по слотам: { "2024-04-01|09-12": { count: 2, user_ids: [5, 8] } }
        const slotsInfo = {};

        rows.forEach(row => {
            const key = `${row.slot_date}|${row.time_block}`;

            if (!slotsInfo[key]) {
                slotsInfo[key] = {
                    count: 0,
                    user_ids: []
                };
            }

            slotsInfo[key].count++;
            slotsInfo[key].user_ids.push(row.student_id);
        });

        // Получаем записи текущего пользователя (для отображения его заявок)
        const { rows: mine } = await db.query(`
            SELECT 
                id,
                slot_date::TEXT AS slot_date,
                time_block,
                specialization,
                problem_description,
                status
            FROM repair_bookings
            WHERE student_id = $1
              AND slot_date BETWEEN $2 AND $3
              AND status IN ('pending', 'accepted')
        `, [req.user.id, start, endStr]);

        res.json({
            slotsInfo,      // { "дата|блок": { count, user_ids } }
            myBookings: mine // [{ id, slot_date, time_block, ... }]
        });

    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/repairs/book', authMiddleware, async (req, res) => {
    const { slot_date, time_block, specialization, problem_description } = req.body;

    await db.query(`
            INSERT INTO repair_bookings (
                slot_date,
                time_block,
                student_id,
                specialization,
                problem_description,
                status
            ) VALUES ($1, $2, $3, $4, $5, 'pending')
        `, [slot_date, time_block, req.user.id, specialization, problem_description]);

    res.json({ status: 'ok', message: 'Заявка успешно отправлена' });
});

app.delete('/repairs/bookings/:id', authMiddleware, async (req, res) => {
    const bookingId = Number(req.params.id);

    await db.query(`
            DELETE FROM repair_bookings 
            WHERE id = $1
        `, [bookingId]);

    res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});