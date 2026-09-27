const router = require('express').Router();
const pool = require('../db');

// GET /api/products
router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM PRODUCT ORDER BY product_id');
  res.json(rows);
});

// POST /api/products  (admin adds a new product)
router.post('/', async (req, res) => {
  const { name, category, price, stock } = req.body;
  const [result] = await pool.query(
    'INSERT INTO PRODUCT (name, category, price, stock) VALUES (?, ?, ?, ?)',
    [name, category, price, stock || 0]
  );
  res.status(201).json({ product_id: result.insertId });
});

module.exports = router;
