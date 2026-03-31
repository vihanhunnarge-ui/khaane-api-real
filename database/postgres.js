const { Pool } = require('pg');
require('dotenv').config();

console.log('Database URL exists:', !!process.env.DATABASE_URL);
console.log('Database URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ PostgreSQL connected successfully');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
}

// Execute query
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

// Get pool for transactions
function getPool() {
  return pool;
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  getPool
};
