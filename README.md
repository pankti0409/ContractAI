# ContractAI

An intelligent contract analysis and management application built with React and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ContractAI
   ```

2. **Setup Backend**
   ```bash
   cd Be
   npm run setup  # Installs dependencies + sets up database
   npm run dev    # Start backend server
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd Fe
   npm install
   npm run dev    # Start frontend server
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Default login: `admin@contractai.com` / `admin123`

## 🗄️ Database Management

| Command | Description |
|---------|-------------|
| `npm run setup` | Complete setup (dependencies + database) |
| `npm run db:setup` | Setup database only |
| `npm run db:reset` | Reset database (clears all data) |
| `npm run db:validate` | Validate database setup |
| `npm run db:setup-windows` | Windows PowerShell setup |

## 📁 Project Structure

```
ContractAI/
├── Be/                 # Backend (Node.js + Express)
│   ├── src/
│   ├── scripts/        # Database automation scripts
│   └── DATABASE_SETUP.md
└── Fe/                 # Frontend (React + TypeScript)
    └── src/
```

## 🔧 Manual Setup

If you prefer manual setup, see [DATABASE_SETUP.md](Be/DATABASE_SETUP.md) for detailed instructions.

## 🐛 Troubleshooting

- **Database connection issues**: Ensure PostgreSQL is running
- **Permission errors**: Check PostgreSQL user privileges
- **Port conflicts**: Verify ports 3001 and 5173 are available
- **Setup validation**: Run `npm run db:validate`

For detailed troubleshooting, see [DATABASE_SETUP.md](Be/DATABASE_SETUP.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run db:validate`
5. Submit a pull request