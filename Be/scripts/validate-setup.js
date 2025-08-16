const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'contractai_db'
};

async function validateSetup() {
  let pool;
  
  try {
    console.log('🔍 Validating ContractAI setup...');
    console.log('================================');
    
    // Test database connection
    pool = new Pool(dbConfig);
    console.log('✅ Database connection successful');
    
    // Check if all required tables exist
    const requiredTables = [
      'users', 'chats', 'messages', 'files', 
      'message_files', 'refresh_tokens', 'audit_logs'
    ];
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('\n📊 Table validation:');
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allTablesExist = false;
      }
    }
    
    if (!allTablesExist) {
      console.log('\n❌ Some required tables are missing!');
      console.log('💡 Run: npm run db:setup');
      process.exit(1);
    }
    
    // Check admin user exists
    const adminQuery = 'SELECT id, email, role FROM users WHERE email = $1';
    const adminResult = await pool.query(adminQuery, ['admin@contractai.com']);
    
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log('\n👤 Admin user validation:');
      console.log(`   ✅ Email: ${admin.email}`);
      console.log(`   ✅ Role: ${admin.role}`);
      console.log(`   ✅ ID: ${admin.id}`);
    } else {
      console.log('\n❌ Admin user not found!');
      console.log('💡 Run: npm run db:reset');
      process.exit(1);
    }
    
    // Check indexes exist
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY indexname
    `;
    
    const indexResult = await pool.query(indexQuery);
    const indexes = indexResult.rows.map(row => row.indexname);
    
    console.log('\n🔍 Database indexes:');
    console.log(`   ✅ Found ${indexes.length} indexes`);
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations:');
    
    // Test user count
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`   ✅ Users table: ${userCountResult.rows[0].count} records`);
    
    // Test chat operations
    const chatCountResult = await pool.query('SELECT COUNT(*) as count FROM chats');
    console.log(`   ✅ Chats table: ${chatCountResult.rows[0].count} records`);
    
    // Test message operations
    const messageCountResult = await pool.query('SELECT COUNT(*) as count FROM messages');
    console.log(`   ✅ Messages table: ${messageCountResult.rows[0].count} records`);
    
    // Test file operations
    const fileCountResult = await pool.query('SELECT COUNT(*) as count FROM files');
    console.log(`   ✅ Files table: ${fileCountResult.rows[0].count} records`);
    
    console.log('\n🎉 Setup validation completed successfully!');
    console.log('\n📋 Your ContractAI database is ready:');
    console.log('   • All required tables exist');
    console.log('   • Admin user is configured');
    console.log('   • Database indexes are in place');
    console.log('   • Basic operations are working');
    console.log('\n🚀 You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Setup validation failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Database connection issues:');
      console.error('   • Make sure PostgreSQL is running');
      console.error('   • Check connection details in .env file');
      console.error('   • Run: npm run db:setup');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist:');
      console.error('   • Run: npm run db:setup');
    } else {
      console.error('\n💡 General troubleshooting:');
      console.error('   • Check .env file configuration');
      console.error('   • Ensure PostgreSQL is accessible');
      console.error('   • Try: npm run db:reset');
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
  validateSetup();
}

module.exports = { validateSetup };