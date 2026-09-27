const router = require('express').Router();
const pool = require('../db');

// GET /api/orders/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM ORDERS WHERE member_id = ? ORDER BY order_date DESC',
    [req.params.memberId]
  );
  res.json(rows);
});

// POST /api/orders  — place a new order with line items
// body: { member_id, items: [{ product_id, quantity }] }
router.post('/', async (req, res) => {
  const { member_id, items } = req.body;
  if (!member_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'member_id and items[] are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [products] = await conn.query(
      `SELECT product_id, price FROM PRODUCT WHERE product_id IN (${items.map(() => '?').join(',')})`,
      items.map(i => i.product_id)
    );
    const priceMap = Object.fromEntries(products.map(p => [p.product_id, p.price]));
    const total = items.reduce((sum, i) => sum + priceMap[i.product_id] * i.quantity, 0);

    const [orderResult] = await conn.query(
      'INSERT INTO ORDERS (member_id, total_amount, status) VALUES (?, ?, ?)',
      [member_id, total, 'pending']
    );

    for (const item of items) {
      await conn.query(
        'INSERT INTO ORDER_ITEM (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderResult.insertId, item.product_id, item.quantity, priceMap[item.product_id]]
      );
    }

    await conn.commit();
    res.status(201).json({ order_id: orderResult.insertId, total_amount: total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PATCH /api/orders/:id/status  — e.g. mark 'completed'
// (updating to 'completed' fires trg_generate_sponsor_commission in MySQL)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE ORDERS SET status = ? WHERE order_id = ?', [status, req.params.id]);
  res.json({ order_id: req.params.id, status });
});

module.exports = router;
