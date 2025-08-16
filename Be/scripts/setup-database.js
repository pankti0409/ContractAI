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
  // Connect to postgres database first to create our target database
  database: 'postgres'
};

const targetDbName = process.env.DB_NAME || 'contractai_db';

async function setupDatabase() {
  let pool;
  
  try {
    console.log('🚀 Starting database setup...');
    
    // Connect to PostgreSQL server
    pool = new Pool(dbConfig);
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists, create if not
    const dbExistsQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExistsResult = await pool.query(dbExistsQuery, [targetDbName]);
    
    if (dbExistsResult.rows.length === 0) {
      console.log(`📦 Creating database: ${targetDbName}`);
      await pool.query(`CREATE DATABASE "${targetDbName}"`);
      console.log('✅ Database created successfully');
    } else {
      console.log(`✅ Database ${targetDbName} already exists`);
    }
    
    // Close connection to postgres database
    await pool.end();
    
    // Connect to target database
    const targetDbConfig = {
      ...dbConfig,
      database: targetDbName
    };
    
    pool = new Pool(targetDbConfig);
    console.log(`✅ Connected to ${targetDbName} database`);
    
    // Read and execute schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'config', 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    console.log('📋 Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Executing schema...');
    await pool.query(schemaSQL);
    console.log('✅ Schema executed successfully');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log('📊 Created tables:');
    tables.forEach(table => console.log(`   • ${table}`));
    
    // Test connection with a simple query
    const testQuery = 'SELECT COUNT(*) as user_count FROM users';
    const testResult = await pool.query(testQuery);
    console.log(`✅ Database test successful - Users count: ${testResult.rows[0].user_count}`);
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test the application');
    console.log('   3. Use admin@contractai.com / admin123 for initial login');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
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
  setupDatabase();
}

module.exports = { setupDatabase };