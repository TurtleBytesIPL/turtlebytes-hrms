# 🐢 TurtleBytes HRMS — Complete Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL running on port 5432
- npm

---

## Project Structure
```
turtlebytes-hrms/
├── backend/          ← NestJS API (port 3000)
├── frontend/         ← React/Vite (port 5173)
└── SETUP_GUIDE.md
```

---

## STEP 1 — Backend Setup

```powershell
cd backend
npm install
```

Create `.env`:
```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/turtlebytes_hrms"
JWT_SECRET="turtlebytes-secret-key-2024"
PORT=3000
```

Push schema and generate client:
```powershell
npx prisma db push
npx prisma generate
```

Seed the database (37 real employees):
```powershell
npx ts-node prisma/seed.ts
```

Start backend:
```powershell
npm run start:dev
```

✅ Backend running at: http://localhost:3000/api/v1

---

## STEP 2 — Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

✅ Frontend running at: http://localhost:5173

---

## Test Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@turtlebytes.in | Admin@123 |
| HR Admin | hr@turtlebytes.in | HR@123 |
| Employee | any seeded email | Pass@{EmpCode} |

---

## Modules Included

| Module | Description |
|---|---|
| 🔐 Auth | JWT login, role-based access |
| 👥 Employees | Full CRUD + Excel bulk import |
| 🏢 Departments | Department management |
| 🎯 Recruitment | Job openings, pipeline, offers |
| 🚀 Onboarding | 10-step onboarding + 9-step offboarding checklists |
| 📄 Documents | PDF upload, verify/reject, history |
| ⏰ Attendance | Mark attendance, reports |
| 🌴 Leaves | Apply, approve, balance tracking |
| 💰 Payroll | Payslip generation |
| 📊 Performance | Reviews and ratings |
| 📦 Assets | Asset assignment tracking |
| 📢 Announcements | Company-wide announcements |
| 🗓️ Holidays | Holiday calendar |
| 📊 Dashboard | Stats, recent activity |
| 👤 Profile | Employee profile (view/edit) |

---

## Documents Module — How It Works

### Employee Flow
1. Go to **Documents** in sidebar
2. See checklist of required + optional documents
3. Required: Aadhaar, PAN, 10th, 12th, College Marks, 3 Payslips, Experience Letter
4. Click **Upload** → drag & drop PDF (max 10MB, PDF only)
5. Status: **Pending** → HR reviews → **Verified** ✅ or **Rejected** ❌
6. If rejected → see rejection reason in red → **Re-upload** new corrected file
7. Old rejected files kept as history (viewable)
8. Verified docs = locked (cannot edit/delete)

### HR Flow
1. Documents page shows all employee documents
2. Stats: Total / Pending / Verified / Rejected
3. Click **View** → opens PDF in browser
4. Click **Download** → downloads to computer
5. **Verify** ✅ → marks document as verified
6. **Reject** ❌ → enter reason → employee sees it
7. HR can delete any document (employee cannot delete verified/rejected)

### File Storage
- PDFs stored on server at: `backend/uploads/documents/`
- Auto-created on first upload
- Files served at: `GET /api/v1/documents/file/:filename`

---

## Excel Bulk Import

1. Go to Employees → **Import Excel**
2. Select default department
3. Upload `basic_details.xlsx` (matches your format)
4. Preview table loads automatically
5. Click **Import X Employees**
6. View credentials (email + Pass@{EmpCode}) — copy before closing!

---

## Onboarding / Offboarding

### Onboarding (HR)
- Auto-created 10-step checklist per new employee
- Track: Offer Letter → Joining → Equipment → Training → Complete

### Offboarding (HR)
- Click "Initiate Offboarding" → enter relieving date
- 9-step checklist: Resignation → Knowledge Transfer → Exit Interview → Deactivated

---

## Role Permissions

| Feature | Employee | Manager | HR Admin | Super Admin |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit profile | ❌ | ❌ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ✅ | ✅ |
| Verify documents | ❌ | ❌ | ✅ | ✅ |
| View all employees | ❌ | ✅ | ✅ | ✅ |
| Bulk import | ❌ | ❌ | ✅ | ✅ |
| Onboarding/Offboarding | ❌ | ✅ | ✅ | ✅ |
| Payroll | ❌ | ❌ | ✅ | ✅ |
