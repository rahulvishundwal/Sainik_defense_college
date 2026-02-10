const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/* =======================
   ENV VARIABLES (Render)
======================= */
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  JWT_SECRET,
  PORT
} = process.env;

/* =======================
   MYSQL CONNECTION
======================= */
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: { rejectUnauthorized: false }
});

/* =======================
   TEST DB CONNECTION
======================= */
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL connected');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    process.exit(1);
  }
})();

/* =======================
   AUTH MIDDLEWARE
======================= */
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

/* =======================
   AUTH ROUTES
======================= */

// REGISTER USER
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hash]
  );

  res.json({ success: true });
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!rows.length)
    return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, role: user.role });
});

/* =======================
   NEWS – PUBLIC
======================= */
app.get('/api/news', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM news ORDER BY date DESC'
  );
  res.json(rows);
});

/* =======================
   NEWS – ADMIN
======================= */
app.post('/api/admin/news', authenticateAdmin, async (req, res) => {
  const { title, content } = req.body;
  await pool.query(
    'INSERT INTO news (title, content, date) VALUES (?, ?, NOW())',
    [title, content]
  );
  res.json({ success: true });
});

app.put('/api/admin/news/:id', authenticateAdmin, async (req, res) => {
  const { title, content } = req.body;
  await pool.query(
    'UPDATE news SET title=?, content=? WHERE id=?',
    [title, content, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/admin/news/:id', authenticateAdmin, async (req, res) => {
  await pool.query(
    'DELETE FROM news WHERE id=?',
    [req.params.id]
  );
  res.json({ success: true });
});

/* =======================
   START SERVER (RENDER)
======================= */
const serverPort = PORT || 10000;
app.listen(serverPort, () =>
  console.log(`🚀 Server running on port ${serverPort}`)
);

