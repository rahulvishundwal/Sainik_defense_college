const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

/* =======================
   AUTH
======================= */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(401).json({});

  const user = rows[0];
  if (!await bcrypt.compare(password, user.password))
    return res.status(401).json({});

  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET);
  res.json({ token });
});

function admin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  const data = jwt.verify(token, process.env.JWT_SECRET);
  if (data.role !== 'admin') return res.sendStatus(403);
  next();
}

/* =======================
   NEWS
======================= */
app.get('/api/news', async (_, res) => {
  const [rows] = await pool.query('SELECT * FROM news ORDER BY date DESC');
  res.json(rows);
});

app.post('/api/admin/news', admin, async (req, res) => {
  await pool.query(
    'INSERT INTO news (title, content, date) VALUES (?, ?, NOW())',
    [req.body.title, req.body.content]
  );
  res.json({ success: true });
});

app.delete('/api/admin/news/:id', admin, async (req, res) => {
  await pool.query('DELETE FROM news WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

/* =======================
   START
======================= */
app.listen(process.env.PORT || 10000, () =>
  console.log('🚀 Server running')
);
