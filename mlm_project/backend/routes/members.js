const router = require('express').Router();
const pool = require('../db');

// GET /api/members  — list all members with rank + sponsor name
router.get('/', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.member_id, m.name, m.phone, m.join_date,
           r.rank_name, s.name AS sponsor_name
      FROM MEMBER m
      JOIN RANK_MASTER r ON r.rank_id = m.rank_id
 LEFT JOIN MEMBER s       ON s.member_id = m.sponsor_id
     ORDER BY m.member_id`);
  res.json(rows);
});

// GET /api/members/:id  — single member profile
router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.*, r.rank_name, r.commission_rate
      FROM MEMBER m JOIN RANK_MASTER r ON r.rank_id = m.rank_id
     WHERE m.member_id = ?`, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Member not found' });
  res.json(rows[0]);
});

// GET /api/members/:id/downline  — calls sp_get_downline stored procedure
router.get('/:id/downline', async (req, res) => {
  try {
    const [rows] = await pool.query('CALL sp_get_downline(?)', [req.params.id]);
    res.json(rows[0]); // first result set returned by the procedure
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/members/:id/summary  — reads from vw_member_sales_summary view
router.get('/:id/summary', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM vw_member_sales_summary WHERE member_id = ?', [req.params.id]);
  res.json(rows[0] || null);
});

module.exports = router;
