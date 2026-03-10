// import { PrismaClient, Role, EmploymentType, EmployeeStatus, LeaveType, AnnouncementType } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// // ─────────────────────────────────────────────────────────────────────────────
// // EXCEL EMPLOYEES — sourced from basic_details_2.xlsx
// // Do NOT modify this array.
// // All emails : firstname.lastname@turtlebytes.in
// // Password   : Pass@<empId>
// // ─────────────────────────────────────────────────────────────────────────────
// export const EXCEL_EMPLOYEES = [
//   { empId: '12240009', firstName: 'Priyanka', lastName: 'P', email: 'priyanka.p@turtlebytes.in', phone: '9845575570', emergencyPhone: '9008021305', bloodGroup: null, maritalStatus: 'Married', jobTitle: 'HR Generalist', joiningDate: '2026-01-19', dateOfBirth: '1991-12-21', dept: 'HR' },
//   { empId: '12240010', firstName: 'Misba', lastName: 'Khanum', email: 'misba.khanum@turtlebytes.in', phone: '9449569003', emergencyPhone: '9164475833', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '2004-11-01', dept: 'DP' },
//   { empId: '12240011', firstName: 'Kumkum', lastName: 'Ghosh', email: 'kumkum.ghosh@turtlebytes.in', phone: '8588951863', emergencyPhone: '8754473133', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1994-08-28', dept: 'DP' },
//   { empId: '12240012', firstName: 'Anusha', lastName: 'Kummara', email: 'anusha.kummara@turtlebytes.in', phone: '7799234042', emergencyPhone: '8861224433', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1989-02-21', dept: 'DP' },
//   { empId: '12240013', firstName: 'Nadendla', lastName: 'Naveen Kumar', email: 'nadendla.naveen.kumar@turtlebytes.in', phone: '9000841682', emergencyPhone: '9885553601', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1984-12-31', dept: 'DP' },
//   { empId: '12240014', firstName: 'Biswa', lastName: 'Ranjan Panda', email: 'biswa.ranjan.panda@turtlebytes.in', phone: '8431245563', emergencyPhone: '9337048431', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1986-05-10', dept: 'DP' },
//   { empId: '12240015', firstName: 'Abhinav', lastName: 'Kumar', email: 'abhinav.kumar@turtlebytes.in', phone: '9693529897', emergencyPhone: '6294782898', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '2000-08-24', dept: 'DP' },
//   { empId: '12240016', firstName: 'Sheik', lastName: 'Mohammed', email: 'sheik.mohammed@turtlebytes.in', phone: '8939132974', emergencyPhone: '7708394452', bloodGroup: 'A1+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1988-11-08', dept: 'DP' },
//   { empId: '12240017', firstName: 'Venkata', lastName: 'Reddy', email: 'venkata.reddy@turtlebytes.in', phone: '8790720526', emergencyPhone: '9703568006', bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-01-30', dateOfBirth: '1991-06-09', dept: 'DP' },
//   { empId: '12240018', firstName: 'Mallela', lastName: 'Archana', email: 'mallela.archana@turtlebytes.in', phone: '9491836891', emergencyPhone: '7981600254', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-30', dateOfBirth: '2003-07-15', dept: 'DP' },
//   { empId: '12240019', firstName: 'Madan', lastName: 'Mohan P R', email: 'madan.mohan.p.r@turtlebytes.in', phone: '9964070931', emergencyPhone: '9902484462', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1999-08-08', dept: 'DP' },
//   { empId: '12240020', firstName: 'K', lastName: 'Jagadeesh', email: 'k.jagadeesh@turtlebytes.in', phone: '9036466398', emergencyPhone: '9739959306', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1985-07-01', dept: 'DP' },
//   { empId: '12240021', firstName: 'Mantha', lastName: 'Raghavendra', email: 'mantha.raghavendra@turtlebytes.in', phone: '7013284245', emergencyPhone: '6302535933', bloodGroup: null, maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2001-04-07', dept: 'DP' },
//   { empId: '12240022', firstName: 'Mary', lastName: 'Chelsia J', email: 'mary.chelsia.j@turtlebytes.in', phone: '8217097040', emergencyPhone: '9845142235', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2003-03-16', dept: 'DP' },
//   { empId: '12240023', firstName: 'Prafulla', lastName: 'Kar', email: 'prafulla.kar@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: 'B+', maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1991-04-03', dept: 'DP' },
//   { empId: '12240024', firstName: 'Jawadunnisa', lastName: '', email: 'jawadunnisa@turtlebytes.in', phone: '8867700396', emergencyPhone: '8618948586', bloodGroup: 'O', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2005-01-21', dept: 'DP' },
//   { empId: '12240025', firstName: 'Malavika', lastName: 'S', email: 'malavika.s@turtlebytes.in', phone: '9535255218', emergencyPhone: '8431301228', bloodGroup: 'AB+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240026', firstName: 'Asha', lastName: 'Venkata Prasanna', email: 'asha.venkata.prasanna@turtlebytes.in', phone: '7893651305', emergencyPhone: '9182278093', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240027', firstName: 'Chitra', lastName: 'G', email: 'chitra.g@turtlebytes.in', phone: '6363657551', emergencyPhone: '6360672747', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240028', firstName: 'Sree', lastName: 'Hari Nair', email: 'sree.hari.nair@turtlebytes.in', phone: '8792264436', emergencyPhone: '9535220037', bloodGroup: 'AB+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240029', firstName: 'Anugayathri', lastName: 'K', email: 'anugayathri.k@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240030', firstName: 'Isaindhiniya', lastName: '', email: 'isaindhiniya@turtlebytes.in', phone: '9342485083', emergencyPhone: '9629679795', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-07', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240031', firstName: 'Mohan', lastName: 'R', email: 'mohan.r@turtlebytes.in', phone: '9945815946', emergencyPhone: '9353863895', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240032', firstName: 'Stanley', lastName: '', email: 'stanley@turtlebytes.in', phone: '7204802281', emergencyPhone: '9096004965', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240033', firstName: 'Pawan', lastName: 'Kumar', email: 'pawan.kumar@turtlebytes.in', phone: '9148145731', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Office Assistant', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'OPS' },
//   { empId: '12240034', firstName: 'Shrinivas', lastName: 'Kulkarni', email: 'shrinivas.kulkarni@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240035', firstName: 'Chunchu', lastName: 'Balarama Krishna', email: 'chunchu.balarama.krishna@turtlebytes.in', phone: '9704143589', emergencyPhone: '9980128242', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-10', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240036', firstName: 'Dinesh', lastName: 'G', email: 'dinesh.g@turtlebytes.in', phone: '7780342949', emergencyPhone: '8500422650', bloodGroup: 'AB+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-11', dateOfBirth: '2002-12-24', dept: 'DP' },
//   { empId: '12240037', firstName: 'Vyshakh', lastName: 'M', email: 'vyshakh.m@turtlebytes.in', phone: '7829422022', emergencyPhone: '8722742937', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-11', dateOfBirth: '1995-03-09', dept: 'DP' },
//   { empId: '12240038', firstName: 'Gangineni', lastName: 'Ramakrishna', email: 'gangineni.ramakrishna@turtlebytes.in', phone: '6303773891', emergencyPhone: '8919938246', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2000-07-26', dept: 'DP' },
//   { empId: '12240039', firstName: 'Uggina', lastName: 'Anitha', email: 'uggina.anitha@turtlebytes.in', phone: '9346080091', emergencyPhone: '6300943424', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2001-08-17', dept: 'DP' },
//   { empId: '12240040', firstName: 'Abiyouth', lastName: 'Shalvin J', email: 'abiyouth.shalvin.j@turtlebytes.in', phone: '8870584566', emergencyPhone: '9442989445', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2003-04-11', dept: 'DP' },
//   { empId: '12240041', firstName: 'Riza', lastName: 'Fathima', email: 'riza.fathima@turtlebytes.in', phone: '7676888369', emergencyPhone: '8884820804', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2001-11-16', dept: 'DP' },
//   { empId: '12240042', firstName: 'Deivanai', lastName: 'P', email: 'deivanai.p@turtlebytes.in', phone: '6385237274', emergencyPhone: '9003868616', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '1998-10-06', dept: 'DP' },
//   { empId: '12240043', firstName: 'Ruchitha', lastName: 'Daasari', email: 'ruchitha.daasari@turtlebytes.in', phone: '9494405900', emergencyPhone: '9703787055', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: '2003-04-17', dept: 'DP' },
//   { empId: '12240044', firstName: 'Divya', lastName: 'R', email: 'divya.r@turtlebytes.in', phone: '8870558538', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240045', firstName: 'Sathya', lastName: 'V', email: 'sathya.v@turtlebytes.in', phone: '6381233643', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240046', firstName: 'Dhivya', lastName: 'R', email: 'dhivya.r@turtlebytes.in', phone: '9677559503', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'DP' },
//   { empId: '12240047', firstName: 'Rajesh', lastName: 'Nath', email: 'rajesh.nath@turtlebytes.in', phone: '9743368741', emergencyPhone: '8876553147', bloodGroup: 'AB+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '1999-01-01', dept: 'DP' },
//   { empId: '12240048', firstName: 'Goddeti', lastName: 'Prathyusha', email: 'goddeti.prathyusha@turtlebytes.in', phone: '8019450189', emergencyPhone: '8008229322', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-09-11', dept: 'DP' },
//   { empId: '12240049', firstName: 'V', lastName: 'Bhargavi', email: 'v.bhargavi@turtlebytes.in', phone: '6304949248', emergencyPhone: '7013284245', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-06-09', dept: 'DP' },
//   { empId: '12240050', firstName: 'Sonam', lastName: 'Gayakwar', email: 'sonam.gayakwar@turtlebytes.in', phone: '8251018268', emergencyPhone: null, bloodGroup: null, maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-06-12', dept: 'DP' },
//   { empId: '12240051', firstName: 'Laxmi', lastName: 'Chandaragi', email: 'laxmi.chandaragi@turtlebytes.in', phone: '8073520370', emergencyPhone: null, bloodGroup: 'A-', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-08-12', dept: 'DP' },
//   { empId: '12240052', firstName: 'Edara', lastName: 'Karthik', email: 'edara.karthik@turtlebytes.in', phone: '8341215644', emergencyPhone: null, bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2001-11-16', dept: 'DP' },
//   { empId: '12240053', firstName: 'Praveen', lastName: 'Kumar V', email: 'praveen.kumar.v@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-03-08', dept: 'DP' },
//   { empId: '12240054', firstName: 'G', lastName: 'Gyanajyothi', email: 'g.gyanajyothi@turtlebytes.in', phone: '7095383081', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '1996-10-04', dept: 'DP' },
//   { empId: '12240055', firstName: 'Keerthana', lastName: 'G U', email: 'keerthana.g.u@turtlebytes.in', phone: '8088175940', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-06-11', dept: 'DP' },
//   { empId: '12240056', firstName: 'Devireddygari', lastName: 'Sushmitha', email: 'devireddygari.sushmitha@turtlebytes.in', phone: '8688182711', emergencyPhone: null, bloodGroup: 'B+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2003-05-23', dept: 'DP' },
//   { empId: '12240057', firstName: 'Guddam', lastName: 'Shravanthi Reddy', email: 'guddam.shravanthi.reddy@turtlebytes.in', phone: '9392528037', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2004-01-16', dept: 'DP' },
//   { empId: '12240058', firstName: 'Dhanachithra', lastName: 'Venu', email: 'dhanachithra.venu@turtlebytes.in', phone: '9566664415', emergencyPhone: '9986165248', bloodGroup: 'A+', maritalStatus: 'Married', jobTitle: 'Copy Editor', joiningDate: '2026-03-02', dateOfBirth: '1996-07-30', dept: 'DP' },
//   { empId: '12240059', firstName: 'Gunisetti', lastName: 'Anitha', email: 'gunisetti.anitha@turtlebytes.in', phone: '7660973940', emergencyPhone: '9490115789', bloodGroup: null, maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-03-04', dateOfBirth: '1988-10-08', dept: 'DP' },
// ];

// // ─────────────────────────────────────────────────────────────────────────────

// async function main() {
//   console.log('🌱 Seeding TurtleBytes HRMS...\n');

//   const currentYear = new Date().getFullYear();

//   // ─── 0. Clean up old .com admin accounts (migration from old seed) ────────
//   console.log('🧹 Cleaning up legacy accounts...');
//   const oldEmails = ['admin@turtlebytes.com', 'hr@turtlebytes.com'];
//   for (const oldEmail of oldEmails) {
//     const oldEmp = await prisma.employee.findUnique({ where: { email: oldEmail } });
//     if (oldEmp) {
//       await prisma.leaveBalance.deleteMany({ where: { employeeId: oldEmp.id } });
//       await prisma.employee.delete({ where: { email: oldEmail } });
//       console.log(`  🗑  Removed old employee: ${oldEmail}`);
//     }
//     const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
//     if (oldUser) {
//       await prisma.user.delete({ where: { email: oldEmail } });
//       console.log(`  🗑  Removed old user: ${oldEmail}`);
//     }
//   }
//   console.log('  ✅ Cleanup done\n');

//   // ─── 1. Departments ───────────────────────────────────────────────────────
//   console.log('🏢 Creating departments...');

//   const dataDept = await prisma.department.upsert({ where: { code: 'DP' }, update: {}, create: { name: 'Data Processing', code: 'DP', description: 'Data Processing Department' } });
//   const financeDept = await prisma.department.upsert({ where: { code: 'FIN' }, update: {}, create: { name: 'Finance', code: 'FIN', description: 'Finance Department' } });
//   const hrDept = await prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' } });
//   const itDept = await prisma.department.upsert({ where: { code: 'IT' }, update: {}, create: { name: 'Information Technology', code: 'IT', description: 'IT & Software Department' } });
//   const opsDept = await prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS', description: 'Operations Department' } });
//   const adminDept = await prisma.department.upsert({ where: { code: 'ADMIN' }, update: {}, create: { name: 'Admin', code: 'ADMIN', description: 'Admin Department' } });

//   const deptMap: Record<string, string> = {
//     HR: hrDept.id,
//     DP: dataDept.id,
//     IT: itDept.id,
//     OPS: opsDept.id,
//     FIN: financeDept.id,
//     ADMIN: adminDept.id,
//   };

//   console.log('  ✅ 6 departments ready\n');

//   // ─── 2. SUPER_ADMIN ───────────────────────────────────────────────────────
//   console.log('👑 Creating Super Admin...');

//   const adminPassword = await bcrypt.hash('TBIPL@1224', 10);
//   const adminUser = await prisma.user.upsert({
//     where: { email: 'admin@turtlebytes.in' },
//     update: { password: adminPassword, role: Role.SUPER_ADMIN, isActive: true },
//     create: { email: 'admin@turtlebytes.in', password: adminPassword, role: Role.SUPER_ADMIN },
//   });

//   const adminEmployee = await prisma.employee.upsert({
//     where: { email: 'admin@turtlebytes.in' },
//     update: {},
//     create: {
//       employeeCode: 'ADMIN001',
//       firstName: 'Admin',
//       lastName: 'TurtleBytes',
//       email: 'admin@turtlebytes.in',
//       phone: '9000000001',
//       jobTitle: 'Super Admin',
//       employmentType: EmploymentType.FULL_TIME,
//       status: EmployeeStatus.ACTIVE,
//       joiningDate: new Date('2024-01-01'),
//       departmentId: hrDept.id,
//       userId: adminUser.id,
//     },
//   });

//   console.log('  ✅ admin@turtlebytes.in / TBIPL@1224\n');

//   // ─── 3. HR_ADMIN ──────────────────────────────────────────────────────────
//   console.log('👩‍💼 Creating HR Admin...');

//   const hrPassword = await bcrypt.hash('TBIPL@1224', 10);
//   const hrUser = await prisma.user.upsert({
//     where: { email: 'hr@turtlebytes.in' },
//     update: { password: hrPassword, role: Role.HR_ADMIN, isActive: true },
//     create: { email: 'hr@turtlebytes.in', password: hrPassword, role: Role.HR_ADMIN },
//   });

//   const hrEmployee = await prisma.employee.upsert({
//     where: { email: 'hr@turtlebytes.in' },
//     update: {},
//     create: {
//       employeeCode: 'HR001',
//       firstName: 'HR',
//       lastName: 'Manager',
//       email: 'hr@turtlebytes.in',
//       phone: '9000000002',
//       jobTitle: 'HR Manager',
//       employmentType: EmploymentType.FULL_TIME,
//       status: EmployeeStatus.ACTIVE,
//       joiningDate: new Date('2024-01-01'),
//       departmentId: hrDept.id,
//       userId: hrUser.id,
//     },
//   });

//   console.log('  ✅ hr@turtlebytes.in / TBIPL@1224\n');

//   // Leave balances for admin accounts
//   for (const emp of [adminEmployee, hrEmployee]) {
//     await prisma.leaveBalance.createMany({
//       skipDuplicates: true,
//       data: [
//         { employeeId: emp.id, year: currentYear, leaveType: LeaveType.ANNUAL, allocated: 21, used: 0, pending: 0, carried: 0 },
//         { employeeId: emp.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12, used: 0, pending: 0, carried: 0 },
//         { employeeId: emp.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6, used: 0, pending: 0, carried: 0 },
//       ],
//     });
//   }

//   // ─── 4. EXCEL EMPLOYEES ───────────────────────────────────────────────────
//   console.log('👥 Importing Excel employees...\n');

//   for (const emp of EXCEL_EMPLOYEES) {
//     const password = `Pass@${emp.empId}`;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Role: HR in jobTitle → HR_ADMIN, else EMPLOYEE
//     const role: Role = emp.jobTitle.toLowerCase().includes('hr') ? Role.HR_ADMIN : Role.EMPLOYEE;

//     // Create User
//     const user = await prisma.user.upsert({
//       where: { email: emp.email },
//       update: { password: hashedPassword, role, isActive: true },
//       create: { email: emp.email, password: hashedPassword, role },
//     });

//     // Resolve department
//     const departmentId: string = deptMap[emp.dept] ?? deptMap['DP'];

//     // Create Employee
//     const employee = await prisma.employee.upsert({
//       where: { email: emp.email },
//       update: {
//         phone: emp.phone ?? undefined,
//         emergencyPhone: emp.emergencyPhone ?? undefined,
//         bloodGroup: emp.bloodGroup ?? undefined,
//         maritalStatus: emp.maritalStatus ?? undefined,
//         jobTitle: emp.jobTitle,
//         status: EmployeeStatus.ACTIVE,
//       },
//       create: {
//         employeeCode: emp.empId,
//         firstName: emp.firstName,
//         lastName: emp.lastName || '-',
//         email: emp.email,
//         phone: emp.phone ?? undefined,
//         emergencyPhone: emp.emergencyPhone ?? undefined,
//         bloodGroup: emp.bloodGroup ?? undefined,
//         maritalStatus: emp.maritalStatus ?? undefined,
//         jobTitle: emp.jobTitle,
//         joiningDate: new Date(emp.joiningDate),
//         dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : undefined,
//         employmentType: EmploymentType.FULL_TIME,
//         status: EmployeeStatus.ACTIVE,
//         departmentId,
//         managerId: hrEmployee.id,
//         userId: user.id,
//       },
//     });

//     // Leave Balances
//     await prisma.leaveBalance.createMany({
//       skipDuplicates: true,
//       data: [
//         { employeeId: employee.id, year: currentYear, leaveType: LeaveType.ANNUAL, allocated: 21, used: 0, pending: 0, carried: 0 },
//         { employeeId: employee.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12, used: 0, pending: 0, carried: 0 },
//         { employeeId: employee.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6, used: 0, pending: 0, carried: 0 },
//       ],
//     });

//     console.log(`  ✅ ${emp.empId}  ${(emp.firstName + ' ' + emp.lastName).trim().padEnd(30)}  ${password}`);
//   }

//   // ─── 5. Salary Structure ──────────────────────────────────────────────────
//   console.log('\n💰 Creating salary structure...');
//   await prisma.salaryStructure.upsert({
//     where: { name: 'Standard' },
//     update: {},
//     create: { name: 'Standard', basicPercent: 50, hraPercent: 20, conveyance: 1600, medicalAllowance: 1250, pf: true, esi: true },
//   });
//   console.log('  ✅ Standard\n');

//   // ─── 6. Holidays ──────────────────────────────────────────────────────────
//   console.log('📅 Inserting holidays...');
//   const holidays = [
//     { name: 'Republic Day', date: new Date('2026-01-26') },
//     { name: 'Holi', date: new Date('2026-03-02') },
//     { name: 'Eid ul-Fitr', date: new Date('2026-03-31') },
//     { name: 'Good Friday', date: new Date('2026-04-03') },
//     { name: 'Independence Day', date: new Date('2026-08-15') },
//     { name: 'Gandhi Jayanti', date: new Date('2026-10-02') },
//     { name: 'Dussehra', date: new Date('2026-10-20') },
//     { name: 'Diwali', date: new Date('2026-11-08') },
//     { name: 'Christmas', date: new Date('2026-12-25') },
//   ];
//   for (const h of holidays) {
//     await prisma.holiday.upsert({
//       where: { date: h.date },
//       update: {},
//       create: { name: h.name, date: h.date, year: 2026 },
//     });
//     console.log(`  ✅ ${h.name}`);
//   }

//   // ─── 7. Announcements ─────────────────────────────────────────────────────
//   console.log('\n📢 Creating announcements...');
//   // Use upsert pattern via findFirst + create to avoid duplicate issues
//   const ann1Exists = await prisma.announcement.findFirst({ where: { title: 'Welcome to TurtleBytes HRMS' } });
//   if (!ann1Exists) {
//     await prisma.announcement.create({
//       data: {
//         title: 'Welcome to TurtleBytes HRMS',
//         content: 'The HRMS portal is now live. Please log in, complete your profile, and upload your KYC documents. Contact HR for any assistance.',
//         type: AnnouncementType.GENERAL,
//         isPinned: true,
//         createdBy: adminEmployee.id,
//       },
//     });
//   }
//   const ann2Exists = await prisma.announcement.findFirst({ where: { title: 'Document Submission Deadline' } });
//   if (!ann2Exists) {
//     await prisma.announcement.create({
//       data: {
//         title: 'Document Submission Deadline',
//         content: 'All employees must upload their Aadhaar card, PAN card, and educational certificates by the end of this month.',
//         type: AnnouncementType.POLICY,
//         isPinned: false,
//         createdBy: hrEmployee.id,
//       },
//     });
//   }
//   console.log('  ✅ 2 announcements ready\n');

//   // ─── 8. Summary ───────────────────────────────────────────────────────────
//   const totalEmployees = await prisma.employee.count();
//   const totalUsers = await prisma.user.count();
//   const totalLeaveBalances = await prisma.leaveBalance.count();

//   console.log('═'.repeat(65));
//   console.log('✅  SEEDING COMPLETE');
//   console.log('═'.repeat(65));
//   console.log(`   Employees      : ${totalEmployees}`);
//   console.log(`   Users          : ${totalUsers}`);
//   console.log(`   Leave Balances : ${totalLeaveBalances}`);
//   console.log('═'.repeat(65));
//   console.log('\n📋 Login Credentials:\n');
//   console.log('   SUPER ADMIN  →  admin@turtlebytes.in   /  TBIPL@1224');
//   console.log('   HR ADMIN     →  hr@turtlebytes.in      /  TBIPL@1224');
//   console.log('\n   Employee login format:');
//   console.log('   Email    →  firstname.lastname@turtlebytes.in');
//   console.log('   Password →  Pass@<EmpID>');
//   console.log('\n   Example  →  priyanka.p@turtlebytes.in    /  Pass@12240009');
//   console.log('   Example  →  misba.khanum@turtlebytes.in  /  Pass@12240010');
//   console.log('═'.repeat(65));
// }

// main()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());
import { PrismaClient, Role, EmploymentType, EmployeeStatus, LeaveType, AnnouncementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EMPLOYEES — sourced from basic_details_2.xlsx
// Do NOT modify this array.
// All emails : firstname.lastname@turtlebytes.in
// Password   : Pass@<empId>
// ─────────────────────────────────────────────────────────────────────────────
export const EXCEL_EMPLOYEES = [
  { empId: '12240009', firstName: 'Priyanka', lastName: 'P', email: 'priyanka.p@turtlebytes.in', phone: '9845575570', emergencyPhone: '9008021305', bloodGroup: null, maritalStatus: 'Married', jobTitle: 'HR Generalist', joiningDate: '2026-01-19', dateOfBirth: '1991-12-21', dept: 'HR' },
  { empId: '12240010', firstName: 'Misba', lastName: 'Khanum', email: 'misba.khanum@turtlebytes.in', phone: '9449569003', emergencyPhone: '9164475833', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '2004-11-01', dept: 'DP' },
  { empId: '12240011', firstName: 'Kumkum', lastName: 'Ghosh', email: 'kumkum.ghosh@turtlebytes.in', phone: '8588951863', emergencyPhone: '8754473133', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1994-08-28', dept: 'DP' },
  { empId: '12240012', firstName: 'Anusha', lastName: 'Kummara', email: 'anusha.kummara@turtlebytes.in', phone: '7799234042', emergencyPhone: '8861224433', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1989-02-21', dept: 'DP' },
  { empId: '12240013', firstName: 'Nadendla', lastName: 'Naveen Kumar', email: 'nadendla.naveen.kumar@turtlebytes.in', phone: '9000841682', emergencyPhone: '9885553601', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1984-12-31', dept: 'DP' },
  { empId: '12240014', firstName: 'Biswa', lastName: 'Ranjan Panda', email: 'biswa.ranjan.panda@turtlebytes.in', phone: '8431245563', emergencyPhone: '9337048431', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1986-05-10', dept: 'DP' },
  { empId: '12240015', firstName: 'Abhinav', lastName: 'Kumar', email: 'abhinav.kumar@turtlebytes.in', phone: '9693529897', emergencyPhone: '6294782898', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '2000-08-24', dept: 'DP' },
  { empId: '12240016', firstName: 'Sheik', lastName: 'Mohammed', email: 'sheik.mohammed@turtlebytes.in', phone: '8939132974', emergencyPhone: '7708394452', bloodGroup: 'A1+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-01-29', dateOfBirth: '1988-11-08', dept: 'DP' },
  { empId: '12240017', firstName: 'Venkata', lastName: 'Reddy', email: 'venkata.reddy@turtlebytes.in', phone: '8790720526', emergencyPhone: '9703568006', bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-01-30', dateOfBirth: '1991-06-09', dept: 'DP' },
  { empId: '12240018', firstName: 'Mallela', lastName: 'Archana', email: 'mallela.archana@turtlebytes.in', phone: '9491836891', emergencyPhone: '7981600254', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-01-30', dateOfBirth: '2003-07-15', dept: 'DP' },
  { empId: '12240019', firstName: 'Madan', lastName: 'Mohan P R', email: 'madan.mohan.p.r@turtlebytes.in', phone: '9964070931', emergencyPhone: '9902484462', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1999-08-08', dept: 'DP' },
  { empId: '12240020', firstName: 'K', lastName: 'Jagadeesh', email: 'k.jagadeesh@turtlebytes.in', phone: '9036466398', emergencyPhone: '9739959306', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1985-07-01', dept: 'DP' },
  { empId: '12240021', firstName: 'Mantha', lastName: 'Raghavendra', email: 'mantha.raghavendra@turtlebytes.in', phone: '7013284245', emergencyPhone: '6302535933', bloodGroup: null, maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2001-04-07', dept: 'DP' },
  { empId: '12240022', firstName: 'Mary', lastName: 'Chelsia J', email: 'mary.chelsia.j@turtlebytes.in', phone: '8217097040', emergencyPhone: '9845142235', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2003-03-16', dept: 'DP' },
  { empId: '12240023', firstName: 'Prafulla', lastName: 'Kar', email: 'prafulla.kar@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: 'B+', maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '1991-04-03', dept: 'DP' },
  { empId: '12240024', firstName: 'Jawadunnisa', lastName: '', email: 'jawadunnisa@turtlebytes.in', phone: '8867700396', emergencyPhone: '8618948586', bloodGroup: 'O', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-02', dateOfBirth: '2005-01-21', dept: 'DP' },
  { empId: '12240025', firstName: 'Malavika', lastName: 'S', email: 'malavika.s@turtlebytes.in', phone: '9535255218', emergencyPhone: '8431301228', bloodGroup: 'AB+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
  { empId: '12240026', firstName: 'Asha', lastName: 'Venkata Prasanna', email: 'asha.venkata.prasanna@turtlebytes.in', phone: '7893651305', emergencyPhone: '9182278093', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
  { empId: '12240027', firstName: 'Chitra', lastName: 'G', email: 'chitra.g@turtlebytes.in', phone: '6363657551', emergencyPhone: '6360672747', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
  { empId: '12240028', firstName: 'Sree', lastName: 'Hari Nair', email: 'sree.hari.nair@turtlebytes.in', phone: '8792264436', emergencyPhone: '9535220037', bloodGroup: 'AB+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
  { empId: '12240029', firstName: 'Anugayathri', lastName: 'K', email: 'anugayathri.k@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-06', dateOfBirth: null, dept: 'DP' },
  { empId: '12240030', firstName: 'Isaindhiniya', lastName: '', email: 'isaindhiniya@turtlebytes.in', phone: '9342485083', emergencyPhone: '9629679795', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-07', dateOfBirth: null, dept: 'DP' },
  { empId: '12240031', firstName: 'Mohan', lastName: 'R', email: 'mohan.r@turtlebytes.in', phone: '9945815946', emergencyPhone: '9353863895', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
  { empId: '12240032', firstName: 'Stanley', lastName: '', email: 'stanley@turtlebytes.in', phone: '7204802281', emergencyPhone: '9096004965', bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
  { empId: '12240033', firstName: 'Pawan', lastName: 'Kumar', email: 'pawan.kumar@turtlebytes.in', phone: '9148145731', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Office Assistant', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'OPS' },
  { empId: '12240034', firstName: 'Shrinivas', lastName: 'Kulkarni', email: 'shrinivas.kulkarni@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'Data Processor', joiningDate: '2026-02-09', dateOfBirth: null, dept: 'DP' },
  { empId: '12240035', firstName: 'Chunchu', lastName: 'Balarama Krishna', email: 'chunchu.balarama.krishna@turtlebytes.in', phone: '9704143589', emergencyPhone: '9980128242', bloodGroup: 'B+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-10', dateOfBirth: null, dept: 'DP' },
  { empId: '12240036', firstName: 'Dinesh', lastName: 'G', email: 'dinesh.g@turtlebytes.in', phone: '7780342949', emergencyPhone: '8500422650', bloodGroup: 'AB+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-11', dateOfBirth: '2002-12-24', dept: 'DP' },
  { empId: '12240037', firstName: 'Vyshakh', lastName: 'M', email: 'vyshakh.m@turtlebytes.in', phone: '7829422022', emergencyPhone: '8722742937', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-11', dateOfBirth: '1995-03-09', dept: 'DP' },
  { empId: '12240038', firstName: 'Gangineni', lastName: 'Ramakrishna', email: 'gangineni.ramakrishna@turtlebytes.in', phone: '6303773891', emergencyPhone: '8919938246', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2000-07-26', dept: 'OPS' },
  { empId: '12240039', firstName: 'Uggina', lastName: 'Anitha', email: 'uggina.anitha@turtlebytes.in', phone: '9346080091', emergencyPhone: '6300943424', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2001-08-17', dept: 'OPS' },
  { empId: '12240040', firstName: 'Abiyouth', lastName: 'Shalvin J', email: 'abiyouth.shalvin.j@turtlebytes.in', phone: '8870584566', emergencyPhone: '9442989445', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2003-04-11', dept: 'OPS' },
  { empId: '12240041', firstName: 'Riza', lastName: 'Fathima', email: 'riza.fathima@turtlebytes.in', phone: '7676888369', emergencyPhone: '8884820804', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '2001-11-16', dept: 'OPS' },
  { empId: '12240042', firstName: 'Deivanai', lastName: 'P', email: 'deivanai.p@turtlebytes.in', phone: '6385237274', emergencyPhone: '9003868616', bloodGroup: 'O+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-16', dateOfBirth: '1998-10-06', dept: 'OPS' },
  { empId: '12240043', firstName: 'Ruchitha', lastName: 'Daasari', email: 'ruchitha.daasari@turtlebytes.in', phone: '9494405900', emergencyPhone: '9703787055', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: '2003-04-17', dept: 'OPS' },
  { empId: '12240044', firstName: 'Divya', lastName: 'R', email: 'divya.r@turtlebytes.in', phone: '8870558538', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'OPS' },
  { empId: '12240045', firstName: 'Sathya', lastName: 'V', email: 'sathya.v@turtlebytes.in', phone: '6381233643', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'OPS' },
  { empId: '12240046', firstName: 'Dhivya', lastName: 'R', email: 'dhivya.r@turtlebytes.in', phone: '9677559503', emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-17', dateOfBirth: null, dept: 'OPS' },
  { empId: '12240047', firstName: 'Rajesh', lastName: 'Nath', email: 'rajesh.nath@turtlebytes.in', phone: '9743368741', emergencyPhone: '8876553147', bloodGroup: 'AB+', maritalStatus: 'Married', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '1999-01-01', dept: 'DP' },
  { empId: '12240048', firstName: 'Goddeti', lastName: 'Prathyusha', email: 'goddeti.prathyusha@turtlebytes.in', phone: '8019450189', emergencyPhone: '8008229322', bloodGroup: 'B+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-09-11', dept: 'DP' },
  { empId: '12240049', firstName: 'V', lastName: 'Bhargavi', email: 'v.bhargavi@turtlebytes.in', phone: '6304949248', emergencyPhone: '7013284245', bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-06-09', dept: 'DP' },
  { empId: '12240050', firstName: 'Sonam', lastName: 'Gayakwar', email: 'sonam.gayakwar@turtlebytes.in', phone: '8251018268', emergencyPhone: null, bloodGroup: null, maritalStatus: 'Single', jobTitle: 'Data Processor', joiningDate: '2026-02-25', dateOfBirth: '2003-06-12', dept: 'DP' },
  { empId: '12240051', firstName: 'Laxmi', lastName: 'Chandaragi', email: 'laxmi.chandaragi@turtlebytes.in', phone: '8073520370', emergencyPhone: null, bloodGroup: 'A-', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-08-12', dept: 'OPS' },
  { empId: '12240052', firstName: 'Edara', lastName: 'Karthik', email: 'edara.karthik@turtlebytes.in', phone: '8341215644', emergencyPhone: null, bloodGroup: 'A+', maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2001-11-16', dept: 'OPS' },
  { empId: '12240053', firstName: 'Praveen', lastName: 'Kumar V', email: 'praveen.kumar.v@turtlebytes.in', phone: null, emergencyPhone: null, bloodGroup: null, maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-03-08', dept: 'OPS' },
  { empId: '12240054', firstName: 'G', lastName: 'Gyanajyothi', email: 'g.gyanajyothi@turtlebytes.in', phone: '7095383081', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: 'Married', jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '1996-10-04', dept: 'OPS' },
  { empId: '12240055', firstName: 'Keerthana', lastName: 'G U', email: 'keerthana.g.u@turtlebytes.in', phone: '8088175940', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2002-06-11', dept: 'OPS' },
  { empId: '12240056', firstName: 'Devireddygari', lastName: 'Sushmitha', email: 'devireddygari.sushmitha@turtlebytes.in', phone: '8688182711', emergencyPhone: null, bloodGroup: 'B+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2003-05-23', dept: 'OPS' },
  { empId: '12240057', firstName: 'Guddam', lastName: 'Shravanthi Reddy', email: 'guddam.shravanthi.reddy@turtlebytes.in', phone: '9392528037', emergencyPhone: null, bloodGroup: 'O+', maritalStatus: null, jobTitle: 'XML Conversion', joiningDate: '2026-02-25', dateOfBirth: '2004-01-16', dept: 'OPS' },
  { empId: '12240058', firstName: 'Dhanachithra', lastName: 'Venu', email: 'dhanachithra.venu@turtlebytes.in', phone: '9566664415', emergencyPhone: '9986165248', bloodGroup: 'A+', maritalStatus: 'Married', jobTitle: 'Copy Editor', joiningDate: '2026-03-02', dateOfBirth: '1996-07-30', dept: 'DP' },
  { empId: '12240059', firstName: 'Gunisetti', lastName: 'Anitha', email: 'gunisetti.anitha@turtlebytes.in', phone: '7660973940', emergencyPhone: '9490115789', bloodGroup: null, maritalStatus: 'Single', jobTitle: 'XML Conversion', joiningDate: '2026-03-04', dateOfBirth: '1988-10-08', dept: 'OPS' },
];

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding TurtleBytes HRMS...\n');

  const currentYear = new Date().getFullYear();

  // ─── 0. Clean up old .com admin accounts (migration from old seed) ────────
  console.log('🧹 Cleaning up legacy accounts...');
  const oldEmails = ['admin@turtlebytes.com', 'hr@turtlebytes.com'];
  for (const oldEmail of oldEmails) {
    const oldEmp = await prisma.employee.findUnique({ where: { email: oldEmail } });
    if (oldEmp) {
      await prisma.leaveBalance.deleteMany({ where: { employeeId: oldEmp.id } });
      await prisma.employee.delete({ where: { email: oldEmail } });
      console.log(`  🗑  Removed old employee: ${oldEmail}`);
    }
    const oldUser = await prisma.user.findUnique({ where: { email: oldEmail } });
    if (oldUser) {
      await prisma.user.delete({ where: { email: oldEmail } });
      console.log(`  🗑  Removed old user: ${oldEmail}`);
    }
  }
  console.log('  ✅ Cleanup done\n');

  // ─── 0b. Remove old/unwanted departments from DB ─────────────────────────
  console.log('🧹 Cleaning up old departments...');
  const oldDeptCodes = ['QA', 'SALES', 'ENG', 'ENGINEERING'];
  for (const code of oldDeptCodes) {
    const dept = await prisma.department.findUnique({ where: { code } });
    if (dept) {
      // Move any employees in this dept → Data Processing
      const dp = await prisma.department.findUnique({ where: { code: 'DP' } });
      if (dp) {
        await prisma.employee.updateMany({ where: { departmentId: dept.id }, data: { departmentId: dp.id } });
      }
      await prisma.department.delete({ where: { code } });
      console.log(`  🗑  Removed old department: ${code}`);
    }
  }
  console.log('  ✅ Old departments cleaned\n');

  // ─── 1. Departments ───────────────────────────────────────────────────────
  console.log('🏢 Creating departments...');

  const dataDept = await prisma.department.upsert({ where: { code: 'DP' }, update: {}, create: { name: 'Data Processing', code: 'DP', description: 'Data Processing Department' } });
  const financeDept = await prisma.department.upsert({ where: { code: 'FIN' }, update: {}, create: { name: 'Finance', code: 'FIN', description: 'Finance Department' } });
  const hrDept = await prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR', description: 'Human Resources Department' } });
  const itDept = await prisma.department.upsert({ where: { code: 'IT' }, update: {}, create: { name: 'Information Technology', code: 'IT', description: 'IT & Software Department' } });
  const opsDept = await prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS', description: 'Operations Department' } });
  const adminDept = await prisma.department.upsert({ where: { code: 'ADMIN' }, update: {}, create: { name: 'Admin', code: 'ADMIN', description: 'Admin Department' } });

  const deptMap: Record<string, string> = {
    HR: hrDept.id,
    DP: dataDept.id,
    IT: itDept.id,
    OPS: opsDept.id,
    FIN: financeDept.id,
    ADMIN: adminDept.id,
  };

  console.log('  ✅ 6 departments ready (DP, FIN, HR, IT, OPS, ADMIN)\n');

  // ─── 2. SUPER_ADMIN ───────────────────────────────────────────────────────
  console.log('👑 Creating Super Admin...');

  const adminPassword = await bcrypt.hash('TBIPL@1224', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@turtlebytes.in' },
    update: { password: adminPassword, role: Role.SUPER_ADMIN, isActive: true },
    create: { email: 'admin@turtlebytes.in', password: adminPassword, role: Role.SUPER_ADMIN },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { email: 'admin@turtlebytes.in' },
    update: {},
    create: {
      employeeCode: 'ADMIN001',
      firstName: 'Admin',
      lastName: 'TurtleBytes',
      email: 'admin@turtlebytes.in',
      phone: '9000000001',
      jobTitle: 'Super Admin',
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joiningDate: new Date('2024-01-01'),
      departmentId: hrDept.id,
      userId: adminUser.id,
    },
  });

  console.log('  ✅ admin@turtlebytes.in / TBIPL@1224\n');

  // ─── 3. HR_ADMIN ──────────────────────────────────────────────────────────
  console.log('👩‍💼 Creating HR Admin...');

  const hrPassword = await bcrypt.hash('TBIPL@1224', 10);
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@turtlebytes.in' },
    update: { password: hrPassword, role: Role.HR_ADMIN, isActive: true },
    create: { email: 'hr@turtlebytes.in', password: hrPassword, role: Role.HR_ADMIN },
  });

  const hrEmployee = await prisma.employee.upsert({
    where: { email: 'hr@turtlebytes.in' },
    update: {},
    create: {
      employeeCode: 'HR001',
      firstName: 'HR',
      lastName: 'Manager',
      email: 'hr@turtlebytes.in',
      phone: '9000000002',
      jobTitle: 'HR Manager',
      employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE,
      joiningDate: new Date('2024-01-01'),
      departmentId: hrDept.id,
      userId: hrUser.id,
    },
  });

  console.log('  ✅ hr@turtlebytes.in / TBIPL@1224\n');

  // Leave balances for admin accounts
  for (const emp of [adminEmployee, hrEmployee]) {
    await prisma.leaveBalance.createMany({
      skipDuplicates: true,
      data: [
        { employeeId: emp.id, year: currentYear, leaveType: LeaveType.ANNUAL, allocated: 21, used: 0, pending: 0, carried: 0 },
        { employeeId: emp.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12, used: 0, pending: 0, carried: 0 },
        { employeeId: emp.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6, used: 0, pending: 0, carried: 0 },
      ],
    });
  }

  // ─── 4. EXCEL EMPLOYEES ───────────────────────────────────────────────────
  console.log('👥 Importing Excel employees...\n');

  for (const emp of EXCEL_EMPLOYEES) {
    const password = `Pass@${emp.empId}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Role: HR in jobTitle → HR_ADMIN, else EMPLOYEE
    const role: Role = emp.jobTitle.toLowerCase().includes('hr') ? Role.HR_ADMIN : Role.EMPLOYEE;

    // Create User
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: { password: hashedPassword, role, isActive: true },
      create: { email: emp.email, password: hashedPassword, role },
    });

    // Resolve department
    const departmentId: string = deptMap[emp.dept] ?? deptMap['DP'];

    // Create Employee
    const employee = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {
        phone: emp.phone ?? undefined,
        emergencyPhone: emp.emergencyPhone ?? undefined,
        bloodGroup: emp.bloodGroup ?? undefined,
        maritalStatus: emp.maritalStatus ?? undefined,
        jobTitle: emp.jobTitle,
        status: EmployeeStatus.ACTIVE,
      },
      create: {
        employeeCode: emp.empId,
        firstName: emp.firstName,
        lastName: emp.lastName || '-',
        email: emp.email,
        phone: emp.phone ?? undefined,
        emergencyPhone: emp.emergencyPhone ?? undefined,
        bloodGroup: emp.bloodGroup ?? undefined,
        maritalStatus: emp.maritalStatus ?? undefined,
        jobTitle: emp.jobTitle,
        joiningDate: new Date(emp.joiningDate),
        dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : undefined,
        employmentType: EmploymentType.FULL_TIME,
        status: EmployeeStatus.ACTIVE,
        departmentId,
        managerId: hrEmployee.id,
        userId: user.id,
      },
    });

    // Leave Balances
    await prisma.leaveBalance.createMany({
      skipDuplicates: true,
      data: [
        { employeeId: employee.id, year: currentYear, leaveType: LeaveType.ANNUAL, allocated: 21, used: 0, pending: 0, carried: 0 },
        { employeeId: employee.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12, used: 0, pending: 0, carried: 0 },
        { employeeId: employee.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6, used: 0, pending: 0, carried: 0 },
      ],
    });

    console.log(`  ✅ ${emp.empId}  ${(emp.firstName + ' ' + emp.lastName).trim().padEnd(30)}  ${password}`);
  }

  // ─── 5. Salary Structure ──────────────────────────────────────────────────
  console.log('\n💰 Creating salary structure...');
  await prisma.salaryStructure.upsert({
    where: { name: 'Standard' },
    update: {},
    create: { name: 'Standard', basicPercent: 50, hraPercent: 20, conveyance: 1600, medicalAllowance: 1250, pf: true, esi: true },
  });
  console.log('  ✅ Standard\n');

  // ─── 6. Holidays ──────────────────────────────────────────────────────────
  console.log('📅 Inserting holidays...');
  const holidays = [
    { name: 'Republic Day', date: new Date('2026-01-26') },
    { name: 'Holi', date: new Date('2026-03-02') },
    { name: 'Eid ul-Fitr', date: new Date('2026-03-31') },
    { name: 'Good Friday', date: new Date('2026-04-03') },
    { name: 'Independence Day', date: new Date('2026-08-15') },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02') },
    { name: 'Dussehra', date: new Date('2026-10-20') },
    { name: 'Diwali', date: new Date('2026-11-08') },
    { name: 'Christmas', date: new Date('2026-12-25') },
  ];
  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: {},
      create: { name: h.name, date: h.date, year: 2026 },
    });
    console.log(`  ✅ ${h.name}`);
  }

  // ─── 7. Announcements ─────────────────────────────────────────────────────
  console.log('\n📢 Creating announcements...');
  // Use upsert pattern via findFirst + create to avoid duplicate issues
  const ann1Exists = await prisma.announcement.findFirst({ where: { title: 'Welcome to TurtleBytes HRMS' } });
  if (!ann1Exists) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to TurtleBytes HRMS',
        content: 'The HRMS portal is now live. Please log in, complete your profile, and upload your KYC documents. Contact HR for any assistance.',
        type: AnnouncementType.GENERAL,
        isPinned: true,
        createdBy: adminEmployee.id,
      },
    });
  }
  const ann2Exists = await prisma.announcement.findFirst({ where: { title: 'Document Submission Deadline' } });
  if (!ann2Exists) {
    await prisma.announcement.create({
      data: {
        title: 'Document Submission Deadline',
        content: 'All employees must upload their Aadhaar card, PAN card, and educational certificates by the end of this month.',
        type: AnnouncementType.POLICY,
        isPinned: false,
        createdBy: hrEmployee.id,
      },
    });
  }
  console.log('  ✅ 2 announcements ready\n');

  // ─── 8. Summary ───────────────────────────────────────────────────────────
  const totalEmployees = await prisma.employee.count();
  const totalUsers = await prisma.user.count();
  const totalLeaveBalances = await prisma.leaveBalance.count();

  console.log('═'.repeat(65));
  console.log('✅  SEEDING COMPLETE');
  console.log('═'.repeat(65));
  console.log(`   Employees      : ${totalEmployees}`);
  console.log(`   Users          : ${totalUsers}`);
  console.log(`   Leave Balances : ${totalLeaveBalances}`);
  console.log('═'.repeat(65));
  console.log('\n📋 Login Credentials:\n');
  console.log('   SUPER ADMIN  →  admin@turtlebytes.in   /  TBIPL@1224');
  console.log('   HR ADMIN     →  hr@turtlebytes.in      /  TBIPL@1224');
  console.log('\n   Employee login format:');
  console.log('   Email    →  firstname.lastname@turtlebytes.in');
  console.log('   Password →  Pass@<EmpID>');
  console.log('\n   Example  →  priyanka.p@turtlebytes.in    /  Pass@12240009');
  console.log('   Example  →  misba.khanum@turtlebytes.in  /  Pass@12240010');
  console.log('═'.repeat(65));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());