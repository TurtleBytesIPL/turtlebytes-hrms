# TurtleBytes HRMS — Setup & Deployment Guide

## Project Structure
```
turtle-hrms-backend/   → NestJS + Prisma + PostgreSQL
turtle-hrms-frontend/  → React + Vite + TailwindCSS
```

## Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm or yarn

---

## 1. Database Setup

```sql
-- In psql or pgAdmin:
CREATE DATABASE turtlebytes_hrms;
CREATE USER postgres WITH PASSWORD 'TB123';
GRANT ALL PRIVILEGES ON DATABASE turtlebytes_hrms TO postgres;
```

---

## 2. Backend Setup

```bash
cd turtle-hrms-backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET

# Run database migrations
npx prisma migrate dev --schema=prisma/schema.prisma

# OR if deploying fresh to production:
npx prisma migrate deploy --schema=prisma/schema.prisma

# Generate Prisma client
npx prisma generate --schema=prisma/schema.prisma

# Seed initial data (creates admin + departments)
npx ts-node prisma/seed.ts

# Start development server
npm run start:dev

# Start production server
npm run build && npm run start:prod
```

Backend runs on: http://localhost:3000/api/v1

---

## 3. Frontend Setup

```bash
cd turtle-hrms-frontend

# Install dependencies (includes xlsx for Excel import)
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env: set VITE_API_URL

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs on: http://localhost:5173

---

## 4. Default Login Credentials

| Role       | Email                    | Password   |
|------------|--------------------------|------------|
| Super Admin | admin@turtlebytes.com   | Admin@123  |
| Employee    | (from bulk import)       | Pass@<EmpID> e.g. Pass@12240009 |

---

## 5. Employee Import

1. Go to **Employees → Import Employees**
2. Select a department
3. Upload your Excel file (see format below)
4. Preview imported employees
5. Click **Import**

**Excel file format** (rows must match this layout):
- Row 5 (index 4): Header row with `Sl.NO`, `Emp ID`, `Emp Name`, `DOJ`, etc.
- Row 6 (index 5): Sub-header row (Aadhar ID, PAN)
- Row 7 (index 6): Skip row
- Row 8+ (index 7+): Employee data

Required columns: `Emp ID`, `Emp Name`, `DOJ` (Date of Joining), `Email ID`

Auto-generated: Password = `Pass@<EmpID>` (e.g. `Pass@12240009`)

---

## 6. Key Features

- **Dashboard**: HR overview + Employee check-in/check-out
- **Employees**: List, create, bulk import from Excel, profile
- **Attendance**: Daily/Weekly/Monthly reports with CSV download
- **Documents**: PDF upload, HR verification, completion tracking
- **Onboarding**: Browse by department → employee → documents
- **Leaves**: Apply, approve, balance tracking
- **Payroll**: Salary structure, payslips
- **Recruitment**: Job openings, candidates, interviews

---

## 7. Hosting (Production)

### Backend on Railway / Render / EC2:
1. Set environment variables (DATABASE_URL, JWT_SECRET, FRONTEND_URL, PORT)
2. `npm run build`
3. `npm run start:prod`

### Frontend on Vercel / Netlify:
1. Set `VITE_API_URL` to your backend URL
2. `npm run build` → deploy `dist/` folder
3. Add rewrite rule: `/* → /index.html` (for React Router)

---

## 8. Uploads Directory

PDF documents are stored in `turtle-hrms-backend/uploads/documents/`  
This directory is auto-created on first run. For production, mount a persistent volume here.

