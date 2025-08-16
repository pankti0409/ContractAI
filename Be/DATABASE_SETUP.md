# ContractAI Database Setup Guide

This guide explains how to set up the ContractAI database automatically using the provided scripts.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Install dependencies and set up database in one command
npm run setup
```

### Option 2: Windows PowerShell Script
```powershell
# Run the comprehensive Windows setup script
npm run db:setup-windows
```

### Option 3: Manual Database Setup
```bash
# Set up database only
npm run db:setup
```

## 📋 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Full Setup** | `npm run setup` | Install dependencies + setup database |
| **Database Setup** | `npm run db:setup` | Create database and apply schema |
| **Database Reset** | `npm run db:reset` | Drop all data and recreate schema |
| **Windows Setup** | `npm run db:setup-windows` | PowerShell script with validation |

## 🔧 What the Scripts Do

### Database Setup (`npm run db:setup`)
1. ✅ Connects to PostgreSQL server
2. 📦 Creates `contractai_db` database (if not exists)
3. 📋 Applies schema from `src/config/schema.sql`
4. 🏗️ Creates all tables, indexes, and triggers
5. 👤 Inserts default admin user
6. ✅ Verifies setup with test queries

### Database Reset (`npm run db:reset`)
1. 🗑️ Drops all existing tables and data
2. 🔄 Recreates schema from scratch
3. 📊 Restores default admin user
4. ✅ Verifies clean database state

## 📊 Created Database Structure

The setup creates the following tables:
- `users` - User accounts and profiles
- `chats` - Chat conversations
- `messages` - Chat messages
- `files` - Uploaded documents
- `message_files` - Message-file relationships
- `refresh_tokens` - JWT refresh tokens
- `audit_logs` - System audit trail

## 👤 Default Admin User

After setup, you can log in with:
- **Email**: `admin@contractai.com`
- **Password**: `admin123`

> ⚠️ **Security Note**: Change the default admin password in production!

## 🔧 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** (comes with Node.js)

### Database Configuration
Ensure your `.env` file contains:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contractai_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## 🐛 Troubleshooting

### Connection Issues
```
❌ ECONNREFUSED: Connection refused
```
**Solutions:**
- Ensure PostgreSQL service is running
- Check if PostgreSQL is listening on port 5432
- Verify credentials in `.env` file
- Test connection: `psql -h localhost -U postgres`

### Permission Issues
```
❌ Permission denied for database
```
**Solutions:**
- Ensure PostgreSQL user has CREATE DATABASE privileges
- Run: `ALTER USER postgres CREATEDB;`
- Check PostgreSQL authentication settings

### Schema Issues
```
❌ Schema file not found
```
**Solutions:**
- Ensure `src/config/schema.sql` exists
- Check file path and permissions
- Verify you're running from the correct directory

### Windows PowerShell Issues
```
❌ Execution policy restricted
```
**Solutions:**
- Run PowerShell as Administrator
- Execute: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Or use: `npm run db:setup` instead

## 🔄 Development Workflow

### First Time Setup
```bash
# Clone repository
git clone <repository-url>
cd ContractAI/Be

# Complete setup
npm run setup

# Start development server
npm run dev
```

### Reset Database During Development
```bash
# Reset database (clears all data)
npm run db:reset

# Restart server to refresh connections
npm run dev
```

### Production Deployment
```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Build application
npm run build

# Start production server
npm start
```

## 📁 Script Files

- `scripts/setup-database.js` - Node.js database setup script
- `scripts/reset-database.js` - Node.js database reset script
- `scripts/setup-database.ps1` - Windows PowerShell setup script
- `src/config/schema.sql` - Database schema definition

## 🔒 Security Considerations

1. **Change Default Passwords**: Update admin password after first login
2. **Environment Variables**: Never commit `.env` files to version control
3. **Database Access**: Restrict database access in production
4. **SSL Connections**: Enable SSL for production databases

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure PostgreSQL is running and accessible
4. Check the console output for specific error messages

---

**Happy coding! 🚀**