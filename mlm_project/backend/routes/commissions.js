const router = require('express').Router();
const pool = require('../db');

// GET /api/commissions/member/:memberId
router.get('/member/:memberId', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, o.order_date, o.total_amount AS order_total
       FROM COMMISSION c JOIN ORDERS o ON o.order_id = c.order_id
      WHERE c.member_id = ? ORDER BY c.commission_date DESC`,
    [req.params.memberId]
  );
  res.json(rows);
});

// POST /api/commissions/:id/pay — mark a commission as paid & log a PAYMENT
router.post('/:id/pay', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[commission]] = await conn.query('SELECT * FROM COMMISSION WHERE commission_id = ?', [req.params.id]);
    if (!commission) { await conn.rollback(); return res.status(404).json({ error: 'Commission not found' }); }

    await conn.query('UPDATE COMMISSION SET status = "paid" WHERE commission_id = ?', [req.params.id]);
    await conn.query(
      'INSERT INTO PAYMENT (member_id, amount, payment_method, payment_status) VALUES (?, ?, "wallet", "success")',
      [commission.member_id, commission.amount]
    );
    await conn.commit();
    res.json({ commission_id: req.params.id, status: 'paid' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
