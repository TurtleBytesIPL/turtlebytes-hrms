# 🔧 Fix Instructions — After npm audit fix --force Broke Things

The `npm audit fix --force` command downgraded NestJS packages to v7, which is incompatible.
Follow these steps **exactly** to recover.

---

## Step 1 — Delete broken node_modules

```powershell
# In your project folder (turtle-hrms)
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

Or in File Explorer: just delete the `node_modules` folder and `package-lock.json` manually.

---

## Step 2 — Clean install (do NOT run audit fix)

```powershell
npm install
```

That's it. The new `package.json` uses **pinned exact versions** and an `overrides` block to prevent npm from downgrading packages.

---

## Step 3 — Set up the database

```powershell
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

---

## Step 4 — Start the server

```powershell
npm run start:dev
```

Server will be available at: http://localhost:3000/api/v1

---

## ⚠️ Important: Never run `npm audit fix --force` on this project

The vulnerabilities reported are in **dev-only** CLI tooling (NestJS CLI, webpack, etc.) — 
they are NOT present in your production runtime. Running `--force` breaks the entire project.

If you want to suppress the audit warnings, the `.npmrc` file already sets `audit=false`.

---

## ✅ Default Login After Seeding

| Role        | Email                        | Password   |
|-------------|------------------------------|------------|
| Super Admin | admin@turtlebytes.com        | Admin@123  |
| HR Admin    | hr@turtlebytes.com           | Admin@123  |
| Manager     | manager@turtlebytes.com      | Admin@123  |
| Employee    | john.doe@turtlebytes.com     | Admin@123  |
