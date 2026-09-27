const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key';

// POST /api/auth/register  — create USER_ACC + MEMBER in one go
router.post('/register', async (req, res) => {
  const { email, password, name, phone, address, dob, sponsor_id } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password and name are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const hashed = await bcrypt.hash(password, 10);

    const [userResult] = await conn.query(
      'INSERT INTO USER_ACC (email, password, role) VALUES (?, ?, ?)',
      [email, hashed, 'member']
    );

    const [memberResult] = await conn.query(
      `INSERT INTO MEMBER (user_id, sponsor_id, rank_id, name, address, phone, dob)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [userResult.insertId, sponsor_id || null, name, address || null, phone || null, dob || null]
    );

    await conn.commit();
    res.status(201).json({ user_id: userResult.insertId, member_id: memberResult.insertId });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.password, u.role, m.member_id, m.name
         FROM USER_ACC u LEFT JOIN MEMBER m ON m.user_id = u.user_id
        WHERE u.email = ?`,
      [email]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, member_id: user.member_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { user_id: user.user_id, member_id: user.member_id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
