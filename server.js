import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/* ---------------- BASIC SETUP ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

/* ---------------- MYSQL (AIVEN) CONFIG ---------------- */
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false   // REQUIRED FOR AIVEN
  }
};

let pool;

/* ---------------- FILE UPLOAD CONFIG ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ---------------- AUTH MIDDLEWARE ---------------- */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/* ---------------- DATABASE INIT ---------------- */
async function initializeDatabase() {
  pool = mysql.createPool(dbConfig);

  const connection = await pool.getConnection();
  console.log('✅ Connected to Aiven MySQL');
  connection.release();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role ENUM('admin','user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      dob DATE,
      gender VARCHAR(20),
      class VARCHAR(50),
      father_name VARCHAR(255),
      mother_name VARCHAR(255),
      address TEXT,
      previous_school VARCHAR(255),
      hobbies TEXT,
      photo_path VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255),
      subject VARCHAR(500),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS news_updates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500),
      content TEXT,
      date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [admin] = await pool.query(`SELECT id FROM users WHERE username='admin'`);
  if (admin.length === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (username,email,password,role)
       VALUES (?,?,?,?)`,
      ['admin', 'admin@sdc.edu', hashed, 'admin']
    );
    console.log('⚠️ Default admin created (change password)');
  }
}

/* ---------------- AUTH ROUTES ---------------- */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const [users] = await pool.query(
    'SELECT * FROM users WHERE username=?',
    [username]
  );
  if (!users.length) return res.status(401).json({ error: 'Invalid login' });

  const user = users[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid login' });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

/* ---------------- ADMISSION ---------------- */
app.post('/api/admission', upload.single('photo'), async (req, res) => {
  const data = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  await pool.query(
    `INSERT INTO admissions
     (full_name,email,phone,dob,gender,class,father_name,mother_name,address,previous_school,hobbies,photo_path)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      data.full_name, data.email, data.phone, data.dob, data.gender,
      data.class, data.father_name, data.mother_name, data.address,
      data.previous_school, data.hobbies, photo
    ]
  );

  res.json({ success: true });
});

/* ---------------- CONTACT ---------------- */
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  await pool.query(
    `INSERT INTO contacts (name,email,subject,message) VALUES (?,?,?,?)`,
    [name, email, subject, message]
  );
  res.json({ success: true });
});

/* ---------------- ROOT ---------------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------------- START SERVER ---------------- */
(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();
