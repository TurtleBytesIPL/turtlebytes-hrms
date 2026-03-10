import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { DepartmentsModule } from './departments/departments.module.js';
import { LeavesModule } from './leaves/leaves.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { PayrollModule } from './payroll/payroll.module.js';
import { PerformanceModule } from './performance/performance.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { AnnouncementsModule } from './announcements/announcements.module.js';
import { HolidaysModule } from './holidays/holidays.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { RecruitmentModule } from './recruitment/recruitment.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { OnboardingModule } from './onboarding/onboarding.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    DepartmentsModule,
    LeavesModule,
    AttendanceModule,
    PayrollModule,
    PerformanceModule,
    AssetsModule,
    AnnouncementsModule,
    HolidaysModule,
    DashboardModule,
    RecruitmentModule,
    DocumentsModule,
    OnboardingModule,
  ],
})
export class AppModule {}
