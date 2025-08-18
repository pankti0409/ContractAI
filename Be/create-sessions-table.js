const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'contractai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const pool = new Pool(poolConfig);

async function createSessionsTable() {
  try {
    const sqlPath = path.join(__dirname, 'src', 'config', 'user-sessions-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Creating user sessions table...');
    await pool.query(sql);
    console.log('✅ User sessions table created successfully');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user sessions table:', error);
    await pool.end();
    process.exit(1);
  }
}

createSessionsTable();