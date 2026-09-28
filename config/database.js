require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL tidak ditemukan. Pastikan file .env tersedia di root project.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

module.exports = pool;
