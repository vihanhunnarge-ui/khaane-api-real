const { Pool } = require('pg');
require('dotenv').config();

// Parse the connection string to add IPv4 preference
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection with retry
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('✅ PostgreSQL connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ PostgreSQL connection failed (attempt ${i + 1}):`, error.message);
      if (i === retries - 1) return false;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
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
