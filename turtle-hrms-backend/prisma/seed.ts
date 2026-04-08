// import { PrismaClient, Role, EmploymentType, EmployeeStatus, LeaveType, AnnouncementType } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Seeding TurtleBytes HRMS...\n');

//   const year    = new Date().getFullYear();
//   const TBIPL   = await bcrypt.hash('TBIPL@1224',    10);
//   const TL_PASS = await bcrypt.hash('TeamLead@1224', 10);

//   // ─── 1. CLEAN UP OLD STALE .com ACCOUNTS ──────────────────────────────────
//   for (const email of ['admin@turtlebytes.com', 'hr@turtlebytes.com']) {
//     const emp = await prisma.employee.findUnique({ where: { email } }).catch(() => null);
//     if (emp) {
//       await prisma.leaveBalance.deleteMany({ where: { employeeId: emp.id } });
//       await prisma.employee.update({ where: { id: emp.id }, data: { userId: null } });
//       await prisma.employee.delete({ where: { id: emp.id } });
//     }
//     await prisma.user.deleteMany({ where: { email } });
//   }
//   console.log('🧹 Cleaned up old accounts');

//   // ─── 2. DEPARTMENTS ────────────────────────────────────────────────────────
//   const depts = {
//     ADMIN: await prisma.department.upsert({ where:{code:'ADMIN'}, update:{name:'Admin'},                  create:{name:'Admin',                  code:'ADMIN', description:'Administration'     } }),
//     HR:    await prisma.department.upsert({ where:{code:'HR'},    update:{name:'Human Resources'},        create:{name:'Human Resources',        code:'HR',    description:'HR Department'      } }),
//     DP:    await prisma.department.upsert({ where:{code:'DP'},    update:{name:'Data Processing'},        create:{name:'Data Processing',        code:'DP',    description:'Data Processing'    } }),
//     IT:    await prisma.department.upsert({ where:{code:'IT'},    update:{name:'Information Technology'}, create:{name:'Information Technology', code:'IT',    description:'Software & IT'      } }),
//     OPS:   await prisma.department.upsert({ where:{code:'OPS'},   update:{name:'Operations'},             create:{name:'Operations',             code:'OPS',   description:'Operations'         } }),
//     FIN:   await prisma.department.upsert({ where:{code:'FIN'},   update:{name:'Finance & Accounts'},     create:{name:'Finance & Accounts',     code:'FIN',   description:'Finance'            } }),
//   };
//   await prisma.department.deleteMany({ where: { code:{in:['SALES','QA']}, employees:{none:{}} } }).catch(() => {});
//   console.log('🏢 Departments ready');

//   // ─── 3. SYSTEM ACCOUNTS ────────────────────────────────────────────────────
//   const adminUser = await prisma.user.upsert({ where:{email:'admin@turtlebytes.in'},    update:{password:TBIPL,   role:Role.SUPER_ADMIN, isActive:true}, create:{email:'admin@turtlebytes.in',    password:TBIPL,   role:Role.SUPER_ADMIN} });
//   const hrUser    = await prisma.user.upsert({ where:{email:'hr@turtlebytes.in'},       update:{password:TBIPL,   role:Role.HR_ADMIN,    isActive:true}, create:{email:'hr@turtlebytes.in',       password:TBIPL,   role:Role.HR_ADMIN}    });
//   const tlUser    = await prisma.user.upsert({ where:{email:'teamlead@turtlebytes.in'}, update:{password:TL_PASS, role:Role.TEAM_LEAD,   isActive:true}, create:{email:'teamlead@turtlebytes.in', password:TL_PASS, role:Role.TEAM_LEAD}   });

//   const adminEmp = await prisma.employee.upsert({ where:{email:'admin@turtlebytes.in'},    update:{userId:adminUser.id}, create:{employeeCode:'ADMIN001', firstName:'Admin',   lastName:'TurtleBytes', email:'admin@turtlebytes.in',    phone:'9000000001', jobTitle:'Super Admin',  employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.ADMIN.id, userId:adminUser.id} });
//   const hrEmp    = await prisma.employee.upsert({ where:{email:'hr@turtlebytes.in'},       update:{userId:hrUser.id},    create:{employeeCode:'HR001',    firstName:'HR',      lastName:'Manager',     email:'hr@turtlebytes.in',       phone:'9000000002', jobTitle:'HR Manager',   employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.HR.id,    userId:hrUser.id}    });
//   const tlEmp    = await prisma.employee.upsert({ where:{email:'teamlead@turtlebytes.in'}, update:{userId:tlUser.id},    create:{employeeCode:'TL001',     firstName:'Team',    lastName:'Lead',        email:'teamlead@turtlebytes.in', phone:'9000000003', jobTitle:'Team Lead',    employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.ADMIN.id, userId:tlUser.id}    });
//   console.log('👤 System accounts ready');

//   // ─── 4. EMPLOYEES ──────────────────────────────────────────────────────────
//   type E = { id:string; fn:string; ln:string; email:string; phone:string; title:string; dept:keyof typeof depts; joining:string; dob?:string; blood?:string; marital?:string; emergency?:string };
//   const EMPS: E[] = [
//     // Admin managers
//     {id:'12240001',fn:'Nishant Kumar',ln:'Singh',        email:'nishant.kumar@turtlebytes.in',       phone:'9000000011',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     {id:'12240002',fn:'Benjamin',     ln:'Mark',         email:'benjamin.mark@turtlebytes.in',       phone:'9000000012',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     {id:'12240003',fn:'Krishna',      ln:'Murthy',       email:'krishna.murthy@turtlebytes.in',      phone:'9000000013',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     {id:'12240004',fn:'Bindu',        ln:'Maduri',       email:'bindu.maduri@turtlebytes.in',        phone:'9000000014',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     {id:'12240005',fn:'Prajwal',      ln:'Gowda',        email:'prajwal.gowda@turtlebytes.in',       phone:'9000000015',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     {id:'12240006',fn:'Naveen',       ln:'Ravindra',     email:'naveen.ravindra@turtlebytes.in',     phone:'9000000016',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
//     // Finance & HR managers
//     {id:'12240007',fn:'Manonandan',   ln:'Menon',        email:'manonandan.menon@turtlebytes.in',    phone:'9000000017',title:'Finance Manager', dept:'FIN',  joining:'2024-01-01'},
//     {id:'12240008',fn:'Priyadarshini',ln:'V',            email:'priyadarshini.v@turtlebytes.in',     phone:'9000000018',title:'HR Manager',      dept:'HR',   joining:'2024-01-01'},
//     // HR staff
//     {id:'12240009',fn:'Priyanka',     ln:'P',            email:'priyanka.p@turtlebytes.in',          phone:'9845575570',title:'HR Generalist',   dept:'HR',   joining:'2026-01-19',dob:'1991-12-21',marital:'Married', emergency:'9008021305'},
//     // Data Processing
//     {id:'12240010',fn:'Misba',        ln:'Khanum',       email:'misba.khanum@turtlebytes.in',        phone:'9449569003',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'2004-11-01',blood:'O+', marital:'Single',  emergency:'9164475833'},
//     {id:'12240011',fn:'Kumkum',       ln:'Ghosh',        email:'kumkum.ghosh@turtlebytes.in',        phone:'8588951863',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1994-08-28',blood:'O+', marital:'Married', emergency:'8754473133'},
//     {id:'12240012',fn:'Anusha',       ln:'Kummara',      email:'anusha.kummara@turtlebytes.in',      phone:'7799234042',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1989-02-21',blood:'B+', marital:'Married', emergency:'8861224433'},
//     {id:'12240013',fn:'Nadendla',     ln:'Naveen Kumar', email:'nadendla.naveen@turtlebytes.in',     phone:'9000841682',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1984-12-31',blood:'O+', marital:'Married', emergency:'9885553601'},
//     {id:'12240014',fn:'Biswa',        ln:'Ranjan Panda', email:'biswa.ranjan@turtlebytes.in',        phone:'8431245563',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1986-05-10',blood:'O+', marital:'Married', emergency:'9337048431'},
//     {id:'12240015',fn:'Abhinav',      ln:'Kumar',        email:'abhinav.kumar@turtlebytes.in',       phone:'9693529897',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'2000-08-24',blood:'O+', marital:'Single',  emergency:'6294782898'},
//     {id:'12240016',fn:'Sheik',        ln:'Mohammed',     email:'sheik.mohammed@turtlebytes.in',      phone:'8939132974',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1988-11-08',blood:'A1+',marital:'Married', emergency:'7708394452'},
//     {id:'12240017',fn:'Venkata',      ln:'Reddy',        email:'venkata.reddy@turtlebytes.in',       phone:'8790720526',title:'Data Processor',  dept:'DP',   joining:'2026-01-30',dob:'1991-06-09',                               emergency:'9703568006'},
//     {id:'12240018',fn:'Mallela',      ln:'Archana',      email:'mallela.archana@turtlebytes.in',     phone:'9491836891',title:'Data Processor',  dept:'DP',   joining:'2026-01-30',dob:'2003-07-15',blood:'O+', marital:'Single',  emergency:'7981600254'},
//     {id:'12240019',fn:'Madan',        ln:'Mohan P R',    email:'madan.mohan@turtlebytes.in',         phone:'9964070931',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'1999-08-08',blood:'B+', marital:'Single',  emergency:'9902484462'},
//     {id:'12240020',fn:'K',            ln:'Jagadeesh',    email:'k.jagadeesh@turtlebytes.in',         phone:'9036466398',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'1985-07-01',blood:'O+', marital:'Single',  emergency:'9739959306'},
//     {id:'12240021',fn:'Mantha',       ln:'Raghavendra',  email:'mantha.raghavendra@turtlebytes.in',  phone:'7013284245',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2001-04-07',            marital:'Single',  emergency:'6302535933'},
//     {id:'12240022',fn:'Mary',         ln:'Chelsia J',    email:'mary.chelsia@turtlebytes.in',        phone:'8217097040',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2003-03-16',blood:'O+', marital:'Single',  emergency:'9845142235'},
//     {id:'12240023',fn:'Prafulla',     ln:'Kar',          email:'prafulla.kar@turtlebytes.in',        phone:'9000000023',title:'Data Processor',  dept:'DP',   joining:'2026-02-02'},
//     {id:'12240024',fn:'Jawadunnisa',  ln:'Begum',        email:'jawadunnisa@turtlebytes.in',         phone:'8867700396',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2005-01-21',blood:'O',  marital:'Single',  emergency:'8618948586'},
//     {id:'12240025',fn:'Malavika',     ln:'S',            email:'malavika.s@turtlebytes.in',          phone:'9535255218',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'AB+',marital:'Married', emergency:'8431301228'},
//     {id:'12240026',fn:'Asha',         ln:'Venkata',      email:'asha.venkata@turtlebytes.in',        phone:'7893651305',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'O+', marital:'Single',  emergency:'9182278093'},
//     {id:'12240027',fn:'Chitra',       ln:'G',            email:'chitra.g@turtlebytes.in',            phone:'6363657551',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'O+', marital:'Single',  emergency:'6360672747'},
//     {id:'12240028',fn:'Sree',         ln:'Hari Nair',    email:'sree.hari@turtlebytes.in',           phone:'8792264436',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'AB+',marital:'Single',  emergency:'9535220037'},
//     {id:'12240030',fn:'Isaindhiniya', ln:'M',            email:'isaindhiniya@turtlebytes.in',        phone:'9342485083',title:'Data Processor',  dept:'DP',   joining:'2026-02-07',                  blood:'O+', marital:'Single',  emergency:'9629679795'},
//     {id:'12240031',fn:'Mohan',        ln:'R',            email:'mohan.r@turtlebytes.in',             phone:'9945815946',title:'Data Processor',  dept:'DP',   joining:'2026-02-09',                  blood:'B+', marital:'Married', emergency:'9353863895'},
//     {id:'12240032',fn:'Stanley',      ln:'S',            email:'stanley@turtlebytes.in',             phone:'7204802281',title:'Data Processor',  dept:'DP',   joining:'2026-02-09',                  blood:'O+', marital:'Married', emergency:'9096004965'},
//     {id:'12240035',fn:'Chunchu',      ln:'Balarama',     email:'chunchu.balarama@turtlebytes.in',    phone:'9704143589',title:'Data Processor',  dept:'DP',   joining:'2026-02-10',                  blood:'B+', marital:'Married', emergency:'9980128242'},
//     {id:'12240036',fn:'Dinesh',       ln:'G',            email:'dinesh.g@turtlebytes.in',            phone:'7780342949',title:'Data Processor',  dept:'DP',   joining:'2026-02-11',dob:'2002-12-24',blood:'AB+',marital:'Single',  emergency:'8500422650'},
//     {id:'12240037',fn:'Vyshakh',      ln:'M',            email:'vyshakh.m@turtlebytes.in',           phone:'7829422022',title:'Data Processor',  dept:'DP',   joining:'2026-02-11',dob:'1995-03-09',blood:'O+', marital:'Single',  emergency:'8722742937'},
//     {id:'12240038',fn:'Gangineni',    ln:'Ramakrishna',  email:'gangineni.ramakrishna@turtlebytes.in',phone:'6303773891',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2000-07-26',blood:'A+', marital:'Single',  emergency:'8919938246'},
//     {id:'12240039',fn:'Uggina',       ln:'Anitha',       email:'uggina.anitha@turtlebytes.in',       phone:'9346080091',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2001-08-17',blood:'O+', marital:'Single',  emergency:'6300943424'},
//     {id:'12240040',fn:'Abiyouth',     ln:'Shalvin J',    email:'abiyouth.shalvin@turtlebytes.in',    phone:'8870584566',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2003-04-11',blood:'B+', marital:'Single',  emergency:'9442989445'},
//     {id:'12240041',fn:'Riza',         ln:'Fathima',      email:'riza.fathima@turtlebytes.in',        phone:'7676888369',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2001-11-16',blood:'A+', marital:'Single',  emergency:'8884820804'},
//     {id:'12240042',fn:'Deivanai',     ln:'P',            email:'deivanai.p@turtlebytes.in',          phone:'6385237274',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'1998-10-06',blood:'O+', marital:'Single',  emergency:'9003868616'},
//     {id:'12240043',fn:'Ruchitha',     ln:'Daasari',      email:'ruchitha.daasari@turtlebytes.in',    phone:'9494405900',title:'XML Conversion',  dept:'DP',   joining:'2026-02-17',dob:'2003-04-17',blood:'B+', marital:'Single',  emergency:'9703787055'},
//     {id:'12240047',fn:'Rajesh',       ln:'Nath',         email:'rajesh.nath@turtlebytes.in',         phone:'9743368741',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'1999-01-01',blood:'AB+',marital:'Married', emergency:'8876553147'},
//     {id:'12240048',fn:'Goddeti',      ln:'Prathyusha',   email:'goddeti.prathyusha@turtlebytes.in',  phone:'8019450189',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-09-11',blood:'B+', marital:'Single',  emergency:'8008229322'},
//     {id:'12240049',fn:'V',            ln:'Bhargavi',     email:'v.bhargavi@turtlebytes.in',          phone:'6304949248',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-06-09',blood:'A+', marital:'Single',  emergency:'7013284245'},
//     {id:'12240050',fn:'Sonam',        ln:'Gayakwar',     email:'sonam.gayakwar@turtlebytes.in',      phone:'8251018268',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-06-12',            marital:'Single'},
//     {id:'12240051',fn:'Laxmi',        ln:'Chandaragi',   email:'laxmi.chandaragi@turtlebytes.in',    phone:'8073520370',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-08-12',blood:'A-'},
//     {id:'12240052',fn:'Edara',        ln:'Karthik',      email:'edara.karthik@turtlebytes.in',       phone:'8341215644',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2001-11-16',blood:'A+', marital:'Single'},
//     {id:'12240053',fn:'Praveen',      ln:'Kumar V',      email:'praveen.kumar@turtlebytes.in',       phone:'9000000053',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-03-08'},
//     {id:'12240054',fn:'G',            ln:'Gyanajyothi',  email:'g.gyanajyothi@turtlebytes.in',       phone:'7095383081',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'1996-10-04',blood:'O+', marital:'Married'},
//     {id:'12240055',fn:'Keerthana',    ln:'G U',          email:'keerthana.gu@turtlebytes.in',        phone:'8088175940',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-06-11',blood:'O+'},
//     {id:'12240056',fn:'Devireddygari',ln:'Sushmitha',    email:'devireddygari.sushmitha@turtlebytes.in',phone:'8688182711',title:'XML Conversion',dept:'DP',  joining:'2026-02-25',dob:'2003-05-23',blood:'B+'},
//     {id:'12240057',fn:'Guddam',       ln:'Shravanthi',   email:'guddam.shravanthi@turtlebytes.in',   phone:'9392528037',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2004-01-16',blood:'O+'},
//     {id:'12240058',fn:'Dhanachithra', ln:'Venu',         email:'dhanachithra.venu@turtlebytes.in',   phone:'9566664415',title:'Copy Editor',     dept:'DP',   joining:'2026-03-02',dob:'1996-07-30',blood:'A+', marital:'Married', emergency:'9986165248'},
//     {id:'12240059',fn:'Gunisetti',    ln:'Anitha',       email:'gunisetti.anitha@turtlebytes.in',    phone:'7660973940',title:'XML Conversion',  dept:'DP',   joining:'2026-03-04',dob:'1988-10-08',            marital:'Single',  emergency:'9490115789'},
//     // Operations
//     {id:'12240033',fn:'Pawan',        ln:'Kumar',        email:'pawan@turtlebytes.in',               phone:'9148145731',title:'Office Assistant', dept:'OPS', joining:'2026-02-09'},
//     // IT
//     {id:'12240029',fn:'Anugayathri',  ln:'K',            email:'anugayathri.k@turtlebytes.in',       phone:'9000000029',title:'IT Specialist',   dept:'IT',   joining:'2026-02-06'},
//     {id:'12240034',fn:'Shrinivas',    ln:'Kulkarni',     email:'shrinivas.kulkarni@turtlebytes.in',  phone:'9000000034',title:'IT Specialist',   dept:'IT',   joining:'2026-02-09'},
//   ];

//   console.log(`👥 Seeding ${EMPS.length} employees...`);
//   for (const e of EMPS) {
//     const hashed = await bcrypt.hash(`Pass@${e.id}`, 10);
//     const user = await prisma.user.upsert({
//       where:  { email: e.email },
//       update: { password: hashed, isActive: true },
//       create: { email: e.email, password: hashed, role: Role.EMPLOYEE },
//     });
//     await prisma.employee.upsert({
//       where:  { email: e.email },
//       update: { departmentId: depts[e.dept].id, jobTitle: e.title, userId: user.id },
//       create: {
//         employeeCode: e.id, firstName: e.fn, lastName: e.ln, email: e.email, phone: e.phone,
//         jobTitle: e.title, employmentType: EmploymentType.FULL_TIME, status: EmployeeStatus.ACTIVE,
//         joiningDate: new Date(e.joining),
//         dateOfBirth:    e.dob       ? new Date(e.dob) : undefined,
//         bloodGroup:     e.blood     ?? undefined,
//         maritalStatus:  e.marital   ?? undefined,
//         emergencyPhone: e.emergency ?? undefined,
//         departmentId: depts[e.dept].id,
//         managerId:    hrEmp.id,
//         userId:       user.id,
//       },
//     });
//     console.log(`  ✅ ${e.id} | ${(e.fn+' '+e.ln).padEnd(22)} | Pass@${e.id}`);
//   }

//   // ─── 5. LEAVE BALANCES ─────────────────────────────────────────────────────
//   const allEmps = await prisma.employee.findMany({ select: { id: true } });
//   for (const emp of allEmps) {
//     for (const [t, a] of [[LeaveType.SICK,12],[LeaveType.CASUAL,12],[LeaveType.ANNUAL,21]] as [LeaveType,number][]) {
//       await prisma.leaveBalance.upsert({
//         where:  { employeeId_leaveType_year: { employeeId: emp.id, leaveType: t, year } },
//         update: {},
//         create: { employeeId: emp.id, leaveType: t, year, allocated: a, remaining: a, used: 0, pending: 0 },
//       });
//     }
//   }
//   console.log('📅 Leave balances: Sick 12 | Casual 12 | Annual 21');

//   // ─── 6. TEAM ───────────────────────────────────────────────────────────────
//   const team = await prisma.team.upsert({
//     where:  { name: 'All Employees' },
//     update: { leadId: tlEmp.id },
//     create: { name: 'All Employees', description: 'Default team', leadId: tlEmp.id },
//   });
//   await prisma.employee.updateMany({
//     where: { teamId: null, email: { notIn: ['admin@turtlebytes.in','hr@turtlebytes.in','teamlead@turtlebytes.in'] } },
//     data:  { teamId: team.id },
//   });
//   console.log('👥 Team "All Employees" assigned');

//   // ─── 7. SALARY STRUCTURE ──────────────────────────────────────────────────
//   await prisma.salaryStructure.upsert({ where:{name:'Standard'}, update:{}, create:{name:'Standard',basicPercent:50,hraPercent:20,conveyance:1600,medicalAllowance:1250,pf:true,esi:true} });

//   // ─── 8. HOLIDAYS ──────────────────────────────────────────────────────────
//   for (const h of [{name:'Republic Day',date:'2026-01-26'},{name:'Holi',date:'2026-03-02'},{name:'Eid ul-Fitr',date:'2026-03-31'},{name:'Good Friday',date:'2026-04-03'},{name:'Independence Day',date:'2026-08-15'},{name:'Gandhi Jayanti',date:'2026-10-02'},{name:'Dussehra',date:'2026-10-20'},{name:'Diwali',date:'2026-11-08'},{name:'Christmas',date:'2026-12-25'}]) {
//     await prisma.holiday.upsert({ where:{date:new Date(h.date)}, update:{}, create:{name:h.name,date:new Date(h.date),year:2026} });
//   }

//   // ─── 9. ANNOUNCEMENTS ─────────────────────────────────────────────────────
//   await prisma.announcement.createMany({ skipDuplicates:true, data:[
//     { title:'Welcome to TurtleBytes HRMS!', content:'We are live! Please complete your profile and upload documents.', type:AnnouncementType.GENERAL, isPinned:true, createdBy:adminEmp.id },
//     { title:'Document Submission Reminder', content:'Upload Aadhaar, PAN, and degree certificate by month end.', type:AnnouncementType.POLICY, createdBy:hrEmp.id },
//   ]});

//   // ─── DONE ─────────────────────────────────────────────────────────────────
//   console.log('\n✅ Seeding complete!\n');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('🔑 LOGIN CREDENTIALS');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('👑 Super Admin : admin@turtlebytes.in       / TBIPL@1224');
//   console.log('👩 HR Admin    : hr@turtlebytes.in          / TBIPL@1224');
//   console.log('👔 Team Lead   : teamlead@turtlebytes.in    / TeamLead@1224');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
//   console.log('👥 Employees   : <email>                    / Pass@<EmpID>');
//   console.log('   e.g. priyanka.p@turtlebytes.in           / Pass@12240009');
//   console.log('   e.g. nishant.kumar@turtlebytes.in        / Pass@12240001');
//   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
// }

// main()
//   .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
//   .finally(() => prisma.$disconnect());

import { PrismaClient, Role, EmploymentType, EmployeeStatus, LeaveType, AnnouncementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TurtleBytes HRMS...\n');

  const year    = new Date().getFullYear();
  const TBIPL   = await bcrypt.hash('TBIPL@1224',    10);
  const TL_PASS = await bcrypt.hash('TeamLead@1224', 10);

  // ─── 1. CLEAN UP OLD STALE .com ACCOUNTS ──────────────────────────────────
  for (const email of ['admin@turtlebytes.com', 'hr@turtlebytes.com']) {
    const emp = await prisma.employee.findUnique({ where: { email } }).catch(() => null);
    if (emp) {
      await prisma.leaveBalance.deleteMany({ where: { employeeId: emp.id } }).catch(() => {});
      await prisma.employee.update({ where: { id: emp.id }, data: { userId: null } }).catch(() => {});
      await prisma.employee.delete({ where: { id: emp.id } }).catch(() => {});
    }
    // Skip user deletion if referenced by other tables — just deactivate instead
    await prisma.user.updateMany({ where: { email }, data: { isActive: false } }).catch(() => {});
  }
  console.log('🧹 Cleaned up old accounts');

  // ─── 2. DEPARTMENTS ────────────────────────────────────────────────────────
  const depts = {
    ADMIN: await prisma.department.upsert({ where:{code:'ADMIN'}, update:{name:'Admin'},                  create:{name:'Admin',                  code:'ADMIN', description:'Administration'     } }),
    HR:    await prisma.department.upsert({ where:{code:'HR'},    update:{name:'Human Resources'},        create:{name:'Human Resources',        code:'HR',    description:'HR Department'      } }),
    DP:    await prisma.department.upsert({ where:{code:'DP'},    update:{name:'Data Processing'},        create:{name:'Data Processing',        code:'DP',    description:'Data Processing'    } }),
    IT:    await prisma.department.upsert({ where:{code:'IT'},    update:{name:'Information Technology'}, create:{name:'Information Technology', code:'IT',    description:'Software & IT'      } }),
    OPS:   await prisma.department.upsert({ where:{code:'OPS'},   update:{name:'Operations'},             create:{name:'Operations',             code:'OPS',   description:'Operations'         } }),
    FIN:   await prisma.department.upsert({ where:{code:'FIN'},   update:{name:'Finance & Accounts'},     create:{name:'Finance & Accounts',     code:'FIN',   description:'Finance'            } }),
  };
  await prisma.department.deleteMany({ where: { code:{in:['SALES','QA']}, employees:{none:{}} } }).catch(() => {});
  console.log('🏢 Departments ready');

  // ─── 3. SYSTEM ACCOUNTS ────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({ where:{email:'admin@turtlebytes.in'},    update:{password:TBIPL,   role:Role.SUPER_ADMIN, isActive:true}, create:{email:'admin@turtlebytes.in',    password:TBIPL,   role:Role.SUPER_ADMIN} });
  const hrUser    = await prisma.user.upsert({ where:{email:'hr@turtlebytes.in'},       update:{password:TBIPL,   role:Role.HR_ADMIN,    isActive:true}, create:{email:'hr@turtlebytes.in',       password:TBIPL,   role:Role.HR_ADMIN}    });
  const tlUser    = await prisma.user.upsert({ where:{email:'teamlead@turtlebytes.in'}, update:{password:TL_PASS, role:Role.TEAM_LEAD,   isActive:true}, create:{email:'teamlead@turtlebytes.in', password:TL_PASS, role:Role.TEAM_LEAD}   });

  const adminEmp = await prisma.employee.upsert({ where:{email:'admin@turtlebytes.in'},    update:{userId:adminUser.id}, create:{employeeCode:'ADMIN001', firstName:'Admin',   lastName:'TurtleBytes', email:'admin@turtlebytes.in',    phone:'9000000001', jobTitle:'Super Admin',  employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.ADMIN.id, userId:adminUser.id} });
  const hrEmp    = await prisma.employee.upsert({ where:{email:'hr@turtlebytes.in'},       update:{userId:hrUser.id},    create:{employeeCode:'HR001',    firstName:'HR',      lastName:'Manager',     email:'hr@turtlebytes.in',       phone:'9000000002', jobTitle:'HR Manager',   employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.HR.id,    userId:hrUser.id}    });
  const tlEmp    = await prisma.employee.upsert({ where:{email:'teamlead@turtlebytes.in'}, update:{userId:tlUser.id},    create:{employeeCode:'TL001',     firstName:'Team',    lastName:'Lead',        email:'teamlead@turtlebytes.in', phone:'9000000003', jobTitle:'Team Lead',    employmentType:EmploymentType.FULL_TIME, status:EmployeeStatus.ACTIVE, joiningDate:new Date('2024-01-01'), departmentId:depts.ADMIN.id, userId:tlUser.id}    });
  console.log('👤 System accounts ready');

  // ─── 4. EMPLOYEES ──────────────────────────────────────────────────────────
  type E = { id:string; fn:string; ln:string; email:string; phone:string; title:string; dept:keyof typeof depts; joining:string; dob?:string; blood?:string; marital?:string; emergency?:string };
  const EMPS: E[] = [
    // Admin managers
    {id:'12240001',fn:'Nishant Kumar',ln:'Singh',        email:'nishant.kumar@turtlebytes.in',       phone:'9000000011',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    {id:'12240002',fn:'Benjamin',     ln:'Mark',         email:'benjamin.mark@turtlebytes.in',       phone:'9000000012',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    {id:'12240003',fn:'Krishna',      ln:'Murthy',       email:'krishna.murthy@turtlebytes.in',      phone:'9000000013',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    {id:'12240004',fn:'Bindu',        ln:'Maduri',       email:'bindu.maduri@turtlebytes.in',        phone:'9000000014',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    {id:'12240005',fn:'Prajwal',      ln:'Gowda',        email:'prajwal.gowda@turtlebytes.in',       phone:'9000000015',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    {id:'12240006',fn:'Naveen',       ln:'Ravindra',     email:'naveen.ravindra@turtlebytes.in',     phone:'9000000016',title:'Admin Manager',   dept:'ADMIN',joining:'2024-01-01'},
    // Finance & HR managers
    {id:'12240007',fn:'Manonandan',   ln:'Menon',        email:'manonandan.menon@turtlebytes.in',    phone:'9000000017',title:'Finance Manager', dept:'FIN',  joining:'2024-01-01'},
    {id:'12240008',fn:'Priyadarshini',ln:'V',            email:'priyadarshini.v@turtlebytes.in',     phone:'9000000018',title:'HR Manager',      dept:'HR',   joining:'2024-01-01'},
    // HR staff
    {id:'12240009',fn:'Priyanka',     ln:'P',            email:'priyanka.p@turtlebytes.in',          phone:'9845575570',title:'HR Generalist',   dept:'HR',   joining:'2026-01-19',dob:'1991-12-21',marital:'Married', emergency:'9008021305'},
    // Data Processing
    {id:'12240010',fn:'Misba',        ln:'Khanum',       email:'misba.khanum@turtlebytes.in',        phone:'9449569003',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'2004-11-01',blood:'O+', marital:'Single',  emergency:'9164475833'},
    {id:'12240011',fn:'Kumkum',       ln:'Ghosh',        email:'kumkum.ghosh@turtlebytes.in',        phone:'8588951863',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1994-08-28',blood:'O+', marital:'Married', emergency:'8754473133'},
    {id:'12240012',fn:'Anusha',       ln:'Kummara',      email:'anusha.kummara@turtlebytes.in',      phone:'7799234042',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1989-02-21',blood:'B+', marital:'Married', emergency:'8861224433'},
    {id:'12240013',fn:'Nadendla',     ln:'Naveen Kumar', email:'nadendla.naveen@turtlebytes.in',     phone:'9000841682',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1984-12-31',blood:'O+', marital:'Married', emergency:'9885553601'},
    {id:'12240014',fn:'Biswa',        ln:'Ranjan Panda', email:'biswa.ranjan@turtlebytes.in',        phone:'8431245563',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1986-05-10',blood:'O+', marital:'Married', emergency:'9337048431'},
    {id:'12240015',fn:'Abhinav',      ln:'Kumar',        email:'abhinav.kumar@turtlebytes.in',       phone:'9693529897',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'2000-08-24',blood:'O+', marital:'Single',  emergency:'6294782898'},
    {id:'12240016',fn:'Sheik',        ln:'Mohammed',     email:'sheik.mohammed@turtlebytes.in',      phone:'8939132974',title:'Data Processor',  dept:'DP',   joining:'2026-01-29',dob:'1988-11-08',blood:'A1+',marital:'Married', emergency:'7708394452'},
    {id:'12240017',fn:'Venkata',      ln:'Reddy',        email:'venkata.reddy@turtlebytes.in',       phone:'8790720526',title:'Data Processor',  dept:'DP',   joining:'2026-01-30',dob:'1991-06-09',                               emergency:'9703568006'},
    {id:'12240018',fn:'Mallela',      ln:'Archana',      email:'mallela.archana@turtlebytes.in',     phone:'9491836891',title:'Data Processor',  dept:'DP',   joining:'2026-01-30',dob:'2003-07-15',blood:'O+', marital:'Single',  emergency:'7981600254'},
    {id:'12240019',fn:'Madan',        ln:'Mohan P R',    email:'madan.mohan@turtlebytes.in',         phone:'9964070931',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'1999-08-08',blood:'B+', marital:'Single',  emergency:'9902484462'},
    {id:'12240020',fn:'K',            ln:'Jagadeesh',    email:'k.jagadeesh@turtlebytes.in',         phone:'9036466398',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'1985-07-01',blood:'O+', marital:'Single',  emergency:'9739959306'},
    {id:'12240021',fn:'Mantha',       ln:'Raghavendra',  email:'mantha.raghavendra@turtlebytes.in',  phone:'7013284245',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2001-04-07',            marital:'Single',  emergency:'6302535933'},
    {id:'12240022',fn:'Mary',         ln:'Chelsia J',    email:'mary.chelsia@turtlebytes.in',        phone:'8217097040',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2003-03-16',blood:'O+', marital:'Single',  emergency:'9845142235'},
    {id:'12240023',fn:'Prafulla',     ln:'Kar',          email:'prafulla.kar@turtlebytes.in',        phone:'9000000023',title:'Data Processor',  dept:'DP',   joining:'2026-02-02'},
    {id:'12240024',fn:'Jawadunnisa',  ln:'Begum',        email:'jawadunnisa@turtlebytes.in',         phone:'8867700396',title:'Data Processor',  dept:'DP',   joining:'2026-02-02',dob:'2005-01-21',blood:'O',  marital:'Single',  emergency:'8618948586'},
    {id:'12240025',fn:'Malavika',     ln:'S',            email:'malavika.s@turtlebytes.in',          phone:'9535255218',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'AB+',marital:'Married', emergency:'8431301228'},
    {id:'12240026',fn:'Asha',         ln:'Venkata',      email:'asha.venkata@turtlebytes.in',        phone:'7893651305',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'O+', marital:'Single',  emergency:'9182278093'},
    {id:'12240027',fn:'Chitra',       ln:'G',            email:'chitra.g@turtlebytes.in',            phone:'6363657551',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'O+', marital:'Single',  emergency:'6360672747'},
    {id:'12240028',fn:'Sree',         ln:'Hari Nair',    email:'sree.hari@turtlebytes.in',           phone:'8792264436',title:'Data Processor',  dept:'DP',   joining:'2026-02-06',                  blood:'AB+',marital:'Single',  emergency:'9535220037'},
    {id:'12240030',fn:'Isaindhiniya', ln:'M',            email:'isaindhiniya@turtlebytes.in',        phone:'9342485083',title:'Data Processor',  dept:'DP',   joining:'2026-02-07',                  blood:'O+', marital:'Single',  emergency:'9629679795'},
    {id:'12240031',fn:'Mohan',        ln:'R',            email:'mohan.r@turtlebytes.in',             phone:'9945815946',title:'Data Processor',  dept:'DP',   joining:'2026-02-09',                  blood:'B+', marital:'Married', emergency:'9353863895'},
    {id:'12240032',fn:'Stanley',      ln:'S',            email:'stanley@turtlebytes.in',             phone:'7204802281',title:'Data Processor',  dept:'DP',   joining:'2026-02-09',                  blood:'O+', marital:'Married', emergency:'9096004965'},
    {id:'12240035',fn:'Chunchu',      ln:'Balarama',     email:'chunchu.balarama@turtlebytes.in',    phone:'9704143589',title:'Data Processor',  dept:'DP',   joining:'2026-02-10',                  blood:'B+', marital:'Married', emergency:'9980128242'},
    {id:'12240036',fn:'Dinesh',       ln:'G',            email:'dinesh.g@turtlebytes.in',            phone:'7780342949',title:'Data Processor',  dept:'DP',   joining:'2026-02-11',dob:'2002-12-24',blood:'AB+',marital:'Single',  emergency:'8500422650'},
    {id:'12240037',fn:'Vyshakh',      ln:'M',            email:'vyshakh.m@turtlebytes.in',           phone:'7829422022',title:'Data Processor',  dept:'DP',   joining:'2026-02-11',dob:'1995-03-09',blood:'O+', marital:'Single',  emergency:'8722742937'},
    {id:'12240038',fn:'Gangineni',    ln:'Ramakrishna',  email:'gangineni.ramakrishna@turtlebytes.in',phone:'6303773891',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2000-07-26',blood:'A+', marital:'Single',  emergency:'8919938246'},
    {id:'12240039',fn:'Uggina',       ln:'Anitha',       email:'uggina.anitha@turtlebytes.in',       phone:'9346080091',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2001-08-17',blood:'O+', marital:'Single',  emergency:'6300943424'},
    {id:'12240040',fn:'Abiyouth',     ln:'Shalvin J',    email:'abiyouth.shalvin@turtlebytes.in',    phone:'8870584566',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2003-04-11',blood:'B+', marital:'Single',  emergency:'9442989445'},
    {id:'12240041',fn:'Riza',         ln:'Fathima',      email:'riza.fathima@turtlebytes.in',        phone:'7676888369',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'2001-11-16',blood:'A+', marital:'Single',  emergency:'8884820804'},
    {id:'12240042',fn:'Deivanai',     ln:'P',            email:'deivanai.p@turtlebytes.in',          phone:'6385237274',title:'XML Conversion',  dept:'DP',   joining:'2026-02-16',dob:'1998-10-06',blood:'O+', marital:'Single',  emergency:'9003868616'},
    {id:'12240043',fn:'Ruchitha',     ln:'Daasari',      email:'ruchitha.daasari@turtlebytes.in',    phone:'9494405900',title:'XML Conversion',  dept:'DP',   joining:'2026-02-17',dob:'2003-04-17',blood:'B+', marital:'Single',  emergency:'9703787055'},
    {id:'12240047',fn:'Rajesh',       ln:'Nath',         email:'rajesh.nath@turtlebytes.in',         phone:'9743368741',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'1999-01-01',blood:'AB+',marital:'Married', emergency:'8876553147'},
    {id:'12240048',fn:'Goddeti',      ln:'Prathyusha',   email:'goddeti.prathyusha@turtlebytes.in',  phone:'8019450189',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-09-11',blood:'B+', marital:'Single',  emergency:'8008229322'},
    {id:'12240049',fn:'V',            ln:'Bhargavi',     email:'v.bhargavi@turtlebytes.in',          phone:'6304949248',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-06-09',blood:'A+', marital:'Single',  emergency:'7013284245'},
    {id:'12240050',fn:'Charles Pream',ln:'Kumar',     email:'charles.pream@turtlebytes.in',       phone:'9000000050',title:'BDM',            dept:'DP',   joining:'2026-03-19'},
    {id:'12240051',fn:'Sonam',        ln:'Gayakwar',     email:'sonam.gayakwar@turtlebytes.in',      phone:'8251018268',title:'Data Processor',  dept:'DP',   joining:'2026-02-25',dob:'2003-06-12',            marital:'Single'},
    {id:'12240052',fn:'Laxmi',        ln:'Chandaragi',   email:'laxmi.chandaragi@turtlebytes.in',    phone:'8073520370',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-08-12',blood:'A-'},
    {id:'12240053',fn:'Edara',        ln:'Karthik',      email:'edara.karthik@turtlebytes.in',       phone:'8341215644',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2001-11-16',blood:'A+', marital:'Single'},
    {id:'12240054',fn:'Praveen',      ln:'Kumar V',      email:'praveen.kumar@turtlebytes.in',       phone:'9000000053',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-03-08'},
    {id:'12240055',fn:'G',            ln:'Gnanajyothi',  email:'g.gyanajyothi@turtlebytes.in',       phone:'7095383081',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'1996-10-04',blood:'O+', marital:'Married'},
    {id:'12240056',fn:'Keerthana',    ln:'G U',          email:'keerthana.gu@turtlebytes.in',        phone:'8088175940',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2002-06-11',blood:'O+'},
    {id:'12240057',fn:'Devireddygari',ln:'Sushmitha',    email:'devireddygari.sushmitha@turtlebytes.in',phone:'8688182711',title:'XML Conversion',dept:'DP',  joining:'2026-02-25',dob:'2003-05-23',blood:'B+'},
    {id:'12240058',fn:'Guddam',       ln:'Shravanthi Reddy',   email:'guddam.shravanthi@turtlebytes.in',   phone:'9392528037',title:'XML Conversion',  dept:'DP',   joining:'2026-02-25',dob:'2004-01-16',blood:'O+'},
    {id:'12240059',fn:'Dhanachitra',  ln:'Venu',         email:'dhanachithra.venu@turtlebytes.in',   phone:'9566664415',title:'Copy Editor',     dept:'DP',   joining:'2026-03-02',dob:'1996-07-30',blood:'A+', marital:'Married', emergency:'9986165248'},
    {id:'12240060',fn:'Gunisetti',    ln:'Anitha',       email:'gunisetti.anitha@turtlebytes.in',    phone:'7660973940',title:'XML Conversion',  dept:'DP',   joining:'2026-03-04',dob:'1988-10-08',            marital:'Single',  emergency:'9490115789'},
    {id:'12240061',fn:'Shobha',      ln:'M',            email:'shobha.m@turtlebytes.in',            phone:'6360902936',title:'Team Lead',      dept:'DP',   joining:'2026-03-16',dob:'1989-02-23',blood:'AB+',marital:'Married', emergency:'9019576967'},
    {id:'12240062',fn:'B K',         ln:'Raj',          email:'bk.raj@turtlebytes.in',              phone:'9000000062',title:'Staff',           dept:'DP',   joining:'2026-03-19'},
    {id:'12240063',fn:'Pinjarla',    ln:'Satish Kumar', email:'pinjarla.satish@turtlebytes.in',      phone:'9000000063',title:'Staff',           dept:'DP',   joining:'2026-03-25'},
    {id:'12240064',fn:'Ariramkumar', ln:'S',            email:'ariramkumar.s@turtlebytes.in',        phone:'9000000064',title:'Copy Editor',     dept:'DP',   joining:'2026-03-25'},
    {id:'12240065',fn:'Ramya',       ln:'',             email:'ramya@turtlebytes.in',                phone:'9000000065',title:'Copy Editor',     dept:'DP',   joining:'2026-03-30'},
    {id:'12240066',fn:'Uthaya',      ln:'Prakash P',    email:'uthaya.prakash@turtlebytes.in',       phone:'6382111869',title:'Copy Editor',     dept:'DP',   joining:'2026-04-01',dob:'1997-07-01',blood:'O-', marital:'Single',  emergency:'9159306690'},
    // Operations
    {id:'12240033',fn:'Pawan',        ln:'Kumar',        email:'pawan@turtlebytes.in',               phone:'9148145731',title:'Office Assistant', dept:'OPS', joining:'2026-02-09'},
    // IT
    {id:'12240029',fn:'Anugayathri',  ln:'K',            email:'anugayathri.k@turtlebytes.in',       phone:'9000000029',title:'IT Specialist',   dept:'IT',   joining:'2026-02-06'},
    {id:'12240034',fn:'Shrinivas',    ln:'Kulkarni',     email:'shrinivas.kulkarni@turtlebytes.in',  phone:'9000000034',title:'IT Specialist',   dept:'IT',   joining:'2026-02-09'},
  ];

  console.log(`👥 Seeding ${EMPS.length} employees...`);
  for (const e of EMPS) {
    const hashed = await bcrypt.hash(`Pass@${e.id}`, 10);
    const user = await prisma.user.upsert({
      where:  { email: e.email },
      update: { password: hashed, isActive: true },
      create: { email: e.email, password: hashed, role: Role.EMPLOYEE },
    });
    await prisma.employee.upsert({
      where:  { email: e.email },
      update: { departmentId: depts[e.dept].id, jobTitle: e.title, userId: user.id },
      create: {
        employeeCode: e.id, firstName: e.fn, lastName: e.ln, email: e.email, phone: e.phone,
        jobTitle: e.title, employmentType: EmploymentType.FULL_TIME, status: EmployeeStatus.ACTIVE,
        joiningDate: new Date(e.joining),
        dateOfBirth:    e.dob       ? new Date(e.dob) : undefined,
        bloodGroup:     e.blood     ?? undefined,
        maritalStatus:  e.marital   ?? undefined,
        emergencyPhone: e.emergency ?? undefined,
        departmentId: depts[e.dept].id,
        managerId:    hrEmp.id,
        userId:       user.id,
      },
    });
    console.log(`  ✅ ${e.id} | ${(e.fn+' '+e.ln).padEnd(22)} | Pass@${e.id}`);
  }

  // ─── 5. LEAVE BALANCES ─────────────────────────────────────────────────────
  const allEmps = await prisma.employee.findMany({ select: { id: true } });
  for (const emp of allEmps) {
    for (const [t, a] of [[LeaveType.SICK,12],[LeaveType.CASUAL,12],[LeaveType.ANNUAL,21]] as [LeaveType,number][]) {
      await prisma.leaveBalance.upsert({
        where:  { employeeId_leaveType_year: { employeeId: emp.id, leaveType: t, year } },
        update: {},
        create: { employeeId: emp.id, leaveType: t, year, allocated: a, remaining: a, used: 0, pending: 0 },
      });
    }
  }
  console.log('📅 Leave balances: Sick 12 | Casual 12 | Annual 21');

  // ─── 6. TEAM ───────────────────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where:  { name: 'All Employees' },
    update: { leadId: tlEmp.id },
    create: { name: 'All Employees', description: 'Default team', leadId: tlEmp.id },
  });
  await prisma.employee.updateMany({
    where: { teamId: null, email: { notIn: ['admin@turtlebytes.in','hr@turtlebytes.in','teamlead@turtlebytes.in'] } },
    data:  { teamId: team.id },
  });
  console.log('👥 Team "All Employees" assigned');

  // ─── 7. SALARY STRUCTURE ──────────────────────────────────────────────────
  await prisma.salaryStructure.upsert({ where:{name:'Standard'}, update:{}, create:{name:'Standard',basicPercent:50,hraPercent:20,conveyance:1600,medicalAllowance:1250,pf:true,esi:true} });

  // ─── 8. HOLIDAYS ──────────────────────────────────────────────────────────
  for (const h of [{name:'Republic Day',date:'2026-01-26'},{name:'Holi',date:'2026-03-02'},{name:'Eid ul-Fitr',date:'2026-03-31'},{name:'Good Friday',date:'2026-04-03'},{name:'Independence Day',date:'2026-08-15'},{name:'Gandhi Jayanti',date:'2026-10-02'},{name:'Dussehra',date:'2026-10-20'},{name:'Diwali',date:'2026-11-08'},{name:'Christmas',date:'2026-12-25'}]) {
    await prisma.holiday.upsert({ where:{date:new Date(h.date)}, update:{}, create:{name:h.name,date:new Date(h.date),year:2026} });
  }

  // ─── 9. ANNOUNCEMENTS ─────────────────────────────────────────────────────
  await prisma.announcement.createMany({ skipDuplicates:true, data:[
    { title:'Welcome to TurtleBytes HRMS!', content:'We are live! Please complete your profile and upload documents.', type:AnnouncementType.GENERAL, isPinned:true, createdBy:adminEmp.id },
    { title:'Document Submission Reminder', content:'Upload Aadhaar, PAN, and degree certificate by month end.', type:AnnouncementType.POLICY, createdBy:hrEmp.id },
  ]});

  // ─── DONE ─────────────────────────────────────────────────────────────────
  console.log('\n✅ Seeding complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 Super Admin : admin@turtlebytes.in       / TBIPL@1224');
  console.log('👩 HR Admin    : hr@turtlebytes.in          / TBIPL@1224');
  console.log('👔 Team Lead   : teamlead@turtlebytes.in    / TeamLead@1224');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 Employees   : <email>                    / Pass@<EmpID>');
  console.log('   e.g. priyanka.p@turtlebytes.in           / Pass@12240009');
  console.log('   e.g. nishant.kumar@turtlebytes.in        / Pass@12240001');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());