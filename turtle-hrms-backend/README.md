# 🐢 TurtleBytes HRMS

A full-featured **Human Resource Management System** built with **NestJS + Prisma + PostgreSQL** — inspired by Keka HRMS.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | JWT + Passport |
| Validation | class-validator |
| Language | TypeScript 5 |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# .env
DATABASE_URL="postgresql://postgres:TB123@localhost:5432/turtlebytes_hrms?schema=public"
JWT_SECRET="your-super-secret-key-change-this"
PORT=3000
```

### 3. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed
```

### 4. Run the Server
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## 🔐 Default Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@turtlebytes.com | Admin@123 |
| HR Admin | hr@turtlebytes.com | Admin@123 |
| Manager | manager@turtlebytes.com | Admin@123 |
| Employee | john.doe@turtlebytes.com | Admin@123 |

---

## 📋 Modules & API Endpoints

Base URL: `http://localhost:3000/api/v1`

### 🔑 Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login & get JWT token |
| GET | `/auth/profile` | Get current user profile |
| PATCH | `/auth/change-password` | Change password |

### 👥 Employees
| Method | Endpoint | Access |
|---|---|---|
| POST | `/employees` | HR Admin, Super Admin |
| GET | `/employees` | All |
| GET | `/employees/directory` | All |
| GET | `/employees/org-chart` | All |
| GET | `/employees/:id` | All |
| PATCH | `/employees/:id` | HR Admin, Super Admin |
| DELETE | `/employees/:id` | Super Admin |

### 🏢 Departments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/departments` | HR Admin+ |
| GET | `/departments` | All |
| GET | `/departments/:id` | All |
| PATCH | `/departments/:id` | HR Admin+ |
| DELETE | `/departments/:id` | Super Admin |

### 📅 Leaves
| Method | Endpoint | Description |
|---|---|---|
| POST | `/leaves` | Apply for leave |
| GET | `/leaves` | List leaves (filtered by role) |
| GET | `/leaves/balances` | My leave balances |
| GET | `/leaves/balances/:empId` | Employee's leave balances (HR+) |
| PATCH | `/leaves/:id/approve` | Approve/Reject leave (Manager+) |
| PATCH | `/leaves/:id/cancel` | Cancel my leave |

### ⏰ Attendance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/attendance/check-in` | Clock in |
| POST | `/attendance/check-out` | Clock out |
| GET | `/attendance/today` | Today's attendance status |
| GET | `/attendance/summary` | Monthly summary (mine) |
| GET | `/attendance/summary/:empId` | Employee summary (Manager+) |
| GET | `/attendance` | All records |
| POST | `/attendance/manual` | Manual entry (HR+) |
| PATCH | `/attendance/:id` | Update record (HR+) |

### 💰 Payroll
| Method | Endpoint | Description |
|---|---|---|
| POST | `/payroll/generate` | Generate payroll for employee |
| POST | `/payroll/bulk-generate` | Bulk payroll generation |
| GET | `/payroll` | All payrolls (HR+) |
| GET | `/payroll/my-payslips` | My payslips |
| GET | `/payroll/salary-structures` | List salary structures |
| GET | `/payroll/:id` | Payslip detail |
| PATCH | `/payroll/:id/status` | Update payroll status |

### 📊 Performance Reviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/performance` | Create review (Manager+) |
| GET | `/performance` | List reviews |
| GET | `/performance/team` | Team reviews (Manager+) |
| GET | `/performance/:id` | Review detail |
| PATCH | `/performance/:id` | Update review |

### 💻 Assets
| Method | Endpoint | Description |
|---|---|---|
| POST | `/assets` | Add asset (HR+) |
| GET | `/assets` | All assets |
| GET | `/assets/my-assets` | My assigned assets |
| PATCH | `/assets/:id/assign` | Assign to employee |
| PATCH | `/assets/:id/unassign` | Return asset |
| DELETE | `/assets/:id` | Delete asset |

### 📢 Announcements
| Method | Endpoint | Description |
|---|---|---|
| POST | `/announcements` | Create announcement (HR+) |
| GET | `/announcements` | Active announcements |
| PATCH | `/announcements/:id` | Update |
| DELETE | `/announcements/:id` | Delete |

### 🗓 Holidays
| Method | Endpoint | Description |
|---|---|---|
| POST | `/holidays` | Add holiday (HR+) |
| GET | `/holidays?year=2025` | List by year |
| GET | `/holidays/upcoming` | Next holidays |

### 📈 Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Role-based dashboard |
| GET | `/dashboard/admin` | Admin stats (HR+) |
| GET | `/dashboard/employee` | Employee dashboard |

---

## 🗂 Project Structure

```
src/
├── main.ts
├── app.module.ts
├── prisma/               # Prisma service
├── common/
│   ├── guards/           # JWT & Roles guards
│   ├── decorators/       # CurrentUser, Roles decorators
│   └── filters/          # HTTP exception filter
├── auth/                 # Authentication
├── users/                # User management
├── employees/            # Employee CRUD + directory
├── departments/          # Department management
├── leaves/               # Leave requests + approval
├── attendance/           # Clock-in/out + tracking
├── payroll/              # Salary processing
├── performance/          # Performance reviews
├── assets/               # Asset management
├── announcements/        # Company announcements
├── holidays/             # Holiday calendar
└── dashboard/            # Role-based dashboards
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Sample data
```

---

## 🔒 Roles & Access

| Feature | Employee | Manager | HR Admin | Super Admin |
|---|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Manage employees | ❌ | ❌ | ✅ | ✅ |
| Apply leave | ✅ | ✅ | ✅ | ✅ |
| Approve leave | ❌ | ✅ | ✅ | ✅ |
| View attendance | Own | Team | All | All |
| Process payroll | ❌ | ❌ | ✅ | ✅ |
| Create reviews | ❌ | ✅ | ✅ | ✅ |
| Manage assets | ❌ | ❌ | ✅ | ✅ |
| Post announcements | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

---

## 📦 Prisma Commands

```bash
npx prisma generate       # Regenerate client after schema changes
npx prisma migrate dev    # Apply migrations in development
npx prisma migrate deploy # Apply migrations in production
npx prisma db seed        # Seed sample data
npx prisma studio         # Open Prisma Studio (GUI)
```

---

## 🧪 Testing the API

Use the **Authorization** header with Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

Example login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@turtlebytes.com","password":"Admin@123"}'
```
