const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'contractai_db'
};

async function resetDatabase() {
  let pool;
  
  try {
    console.log('🔄 Starting database reset...');
    
    // Connect to target database
    pool = new Pool(dbConfig);
    console.log('✅ Connected to database');
    
    // Drop all tables (CASCADE will handle dependencies)
    console.log('🗑️  Dropping all tables...');
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    console.log('✅ All tables dropped');
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'config', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    console.log('📋 Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Recreating schema...');
    await pool.query(schemaSQL);
    console.log('✅ Schema recreated successfully');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📊 Recreated tables:');
    tables.forEach(table => console.log(`   • ${table}`));
    
    // Test connection with a simple query
    const testQuery = 'SELECT COUNT(*) as user_count FROM users';
    const testResult = await pool.query(testQuery);
    console.log(`✅ Database test successful - Users count: ${testResult.rows[0].user_count}`);
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 Fresh database ready with:');
    console.log('   • All tables recreated');
    console.log('   • Default admin user: admin@contractai.com / admin123');
    console.log('   • All previous data cleared');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running and accessible');
      console.error('   • Check if PostgreSQL service is started');
      console.error('   • Verify connection details in .env file');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Handle script execution
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };