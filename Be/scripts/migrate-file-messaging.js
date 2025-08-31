const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'contractai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running file messaging migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'add-file-messaging-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ File messaging migration completed successfully!');
    console.log('   - Added type column to messages table');
    console.log('   - Added extracted_text column to files table');
    console.log('   - Created performance indexes');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };