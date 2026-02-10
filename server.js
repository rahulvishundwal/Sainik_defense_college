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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sainik_defense_college',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin Only Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Initialize Database Connection
async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database');
    connection.release();

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        dob DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        class VARCHAR(50) NOT NULL,
        father_name VARCHAR(255) NOT NULL,
        mother_name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        previous_school VARCHAR(255),
        hobbies TEXT,
        photo_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_updates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create default admin user if doesn't exist
    const [adminExists] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@sainikdefensecollege.edu.in', hashedPassword, 'admin']
      );
      console.log('✅ Default admin user created (username: admin, password: admin123)');
      console.log('⚠️  Please change the default password immediately!');
    }

    // Insert sample news if table is empty
    const [newsCount] = await pool.query('SELECT COUNT(*) as count FROM news_updates');
    if (newsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO news_updates (title, content, date, is_active) VALUES
        ('Annual Sports Day 2026', 'Join us for the Annual Sports Day on March 15, 2026. Various sporting events and competitions will be held.', '2026-03-15', TRUE),
        ('Republic Day Celebration', 'Grand celebration of 77th Republic Day with cultural programs and flag hoisting ceremony.', '2026-01-26', TRUE),
        ('NDA Coaching Batch Starting Soon', 'New batch for NDA coaching starting from February 20, 2026. Limited seats available.', '2026-02-20', TRUE),
        ('Parent-Teacher Meeting', 'Important PTM scheduled for February 25, 2026. All parents are requested to attend.', '2026-02-25', TRUE),
        ('Science Exhibition 2026', 'Inter-school science exhibition showcasing innovative projects by our students.', '2026-03-10', TRUE)
      `);
      console.log('✅ Sample news data inserted');
    }

    console.log('✅ Database tables created/verified');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  }
}

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get user
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NEWS ROUTES ====================

// Get all active news/updates (public)
app.get('/api/news', async (req, res) => {
  try {
    const [news] = await pool.query(
      'SELECT * FROM news_updates WHERE is_active = TRUE ORDER BY date DESC LIMIT 20'
    );
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all news including inactive (admin only)
app.get('/api/admin/news', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [news] = await pool.query(
      'SELECT * FROM news_updates ORDER BY date DESC'
    );
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create news (admin only)
app.post('/api/admin/news', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, date } = req.body;

    if (!title || !content || !date) {
      return res.status(400).json({ error: 'Title, content, and date are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO news_updates (title, content, date, created_by) VALUES (?, ?, ?, ?)',
      [title, content, date, req.user.id]
    );

    res.json({
      success: true,
      message: 'News created successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update news (admin only)
app.put('/api/admin/news/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, date, is_active } = req.body;

    const [result] = await pool.query(
      'UPDATE news_updates SET title = ?, content = ?, date = ?, is_active = ? WHERE id = ?',
      [title, content, date, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({
      success: true,
      message: 'News updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete news (admin only)
app.delete('/api/admin/news/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM news_updates WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMISSION ROUTES ====================

// Submit admission form
app.post('/api/admission', upload.single('photo'), async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      dob,
      gender,
      class: studentClass,
      father_name,
      mother_name,
      address,
      previous_school,
      hobbies
    } = req.body;

    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO admissions (
        full_name, email, phone, dob, gender, class,
        father_name, mother_name, address, previous_school,
        hobbies, photo_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, dob, gender, studentClass, 
       father_name, mother_name, address, previous_school,
       hobbies, photo_path]
    );

    res.json({
      success: true,
      message: 'Admission form submitted successfully!',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all admissions (admin only)
app.get('/api/admin/admissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [admissions] = await pool.query(
      'SELECT * FROM admissions ORDER BY created_at DESC'
    );
    res.json(admissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CONTACT ROUTES ====================

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const [result] = await pool.query(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.json({
      success: true,
      message: 'Your message has been sent successfully!',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all contacts (admin only)
app.get('/api/admin/contacts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [contacts] = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🏫 Sainik Defense College Website`);
      console.log(`💻 Developed by Rahul Web Solutions`);
      console.log(`\n📝 Default Admin Credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: admin123`);
      console.log(`   ⚠️  Please change the password after first login!\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('\n✅ Server stopped');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database:', err);
    process.exit(1);
  }
});