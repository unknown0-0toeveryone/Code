// db.js - MySQL connection pool (mysql2/promise)
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL);

module.exports = pool;