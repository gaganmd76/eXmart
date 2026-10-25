const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'exmart_secret_key_123';

// Middleware to authenticate user and extract user info
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Middleware to check if admin
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user (default role: customer)
    const result = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, address, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, address, role`,
      [name, email.toLowerCase().trim(), phone, hashedPassword, address, 'customer']
    );

    let newUser;
    if (result.rows && result.rows[0] && result.rows[0].id) {
      newUser = result.rows[0];
    } else {
      // In SQLite fallback, the RETURNING clause is not fully supported or returns lastID. Let's fetch the inserted record
      const lastID = result.lastID;
      const fetchNewUser = await db.query('SELECT id, name, email, phone, address, role FROM users WHERE id = $1', [lastID]);
      newUser = fetchNewUser.rows[0];
    }

    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to sign up. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// GET /api/auth/me (Utility to verify token on client reload)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, address, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

module.exports = {
  router,
  authenticateToken,
  requireAdmin
};
