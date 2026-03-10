# 🐢 TurtleBytes HRMS — Full Stack Setup Guide

## 📁 Project Structure

```
turtle-hrms/         ← NestJS Backend (Port 3000)
hrms-frontend/       ← React Frontend (Port 5173)
```

---

## ⚡ Quick Start (Step by Step)

### Prerequisites
- Node.js v18+
- PostgreSQL running locally
- Two terminal windows open

---

## 🗄️ Step 1 — Database Setup

Open PostgreSQL and create the database:
```sql
CREATE DATABASE turtlebytes_hrms;
```

Or via command line:
```powershell
psql -U postgres -c "CREATE DATABASE turtlebytes_hrms;"
```

---

## 🔧 Step 2 — Backend Setup

```powershell
# In the turtle-hrms folder
cd turtle-hrms

# Install dependencies (if not done)
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init

# Seed sample data
npx prisma db seed

# Start backend server
npm run start:dev
```

✅ Backend runs at: **http://localhost:3000/api/v1**

---

## 🎨 Step 3 — Frontend Setup

Open a **NEW terminal window**:

```powershell
# In the hrms-frontend folder
cd hrms-frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```

✅ Frontend runs at: **http://localhost:5173**

---

## 🔐 Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@turtlebytes.com | Admin@123 |
| HR Admin | hr@turtlebytes.com | Admin@123 |
| Manager | manager@turtlebytes.com | Admin@123 |
| Employee | john.doe@turtlebytes.com | Admin@123 |

The login page has **Quick Login buttons** — just click any role to auto-fill credentials!

---

## 🌐 How It Works

```
Browser (5173) → Vite Proxy → NestJS API (3000) → PostgreSQL
```

The Vite dev server proxies `/api` requests to port 3000 automatically — no CORS issues!

---

## 📋 Features by Role

### 👑 Super Admin / HR Admin
- Full employee management (create, edit, terminate)
- Department management
- Approve/reject leave requests
- Process payroll & generate payslips
- Manage company assets
- Post announcements
- Manage holiday calendar
- Admin dashboard with charts

### 👔 Manager
- View team leaves & approve/reject
- View team attendance
- Create & submit performance reviews
- Employee directory

### 👤 Employee
- Dashboard with attendance check-in/check-out
- Apply for leaves, view balances
- View own attendance & payslips
- Employee directory & org chart

---

## 🔁 Useful Commands

### Backend
```powershell
npm run start:dev        # Development with hot reload
npm run build            # Build for production
npm run start:prod       # Run production build
npx prisma studio        # Open database GUI
npx prisma migrate reset # Reset database (⚠️ deletes data)
```

### Frontend
```powershell
npm run dev              # Development server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## 🚀 Production Deployment

### Backend
```powershell
# Build
npm run build

# Set environment variables
set DATABASE_URL=your_prod_db_url
set JWT_SECRET=your_strong_secret
set NODE_ENV=production

# Run
npm run start:prod
```

### Frontend
```powershell
# Build static files
npm run build
# Output in: dist/ folder
# Deploy to Nginx, Vercel, Netlify, etc.
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `P1001` - Can't reach database | Check PostgreSQL is running |
| `401 Unauthorized` | Token expired — log in again |
| CORS error in browser | Make sure backend is running on port 3000 |
| `Module not found` | Run `npm install` again |
| Blank page on frontend | Check browser console for errors |
| `npm audit fix --force` broke things | Delete `node_modules` + `package-lock.json`, run `npm install` |
