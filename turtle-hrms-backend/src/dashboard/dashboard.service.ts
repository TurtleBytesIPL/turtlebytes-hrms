import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployeeStatus, LeaveStatus, PayrollStatus, Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch { return fallback; }
  }

  async getAdminDashboard() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      newJoinees,
      totalDepartments,
      pendingLeaves,
      todayPresent,
      todayAbsent,
      monthPayroll,
      pendingReviews,
      upcomingHolidays,
      recentAnnouncements,
      deptDistribution,
      empStatusBreakdown,
      todayBirthdays,
      upcomingBirthdays,
    ] = await Promise.all([
      this.safe(() => this.prisma.employee.count(), 0),
      this.safe(() => this.prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }), 0),
      this.safe(() => this.prisma.employee.count({
        where: { joiningDate: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
      }), 0),
      this.safe(() => this.prisma.department.count(), 0),
      this.safe(() => this.prisma.leave.count({ where: { status: LeaveStatus.PENDING } }), 0),
      this.safe(() => this.prisma.attendance.count({ where: { date: today, status: 'PRESENT' as any } }), 0),
      this.safe(() => this.prisma.attendance.count({ where: { date: today, status: 'ABSENT' as any } }), 0),
      this.safe(() => this.prisma.payroll.aggregate({
        where: { month, year, status: { not: PayrollStatus.DRAFT } },
        _sum: { netSalary: true },
        _count: true,
      }), { _sum: { netSalary: 0 }, _count: 0 }),
      this.safe(() => this.prisma.performanceReview.count({ where: { status: { in: ['DRAFT', 'SUBMITTED'] as any } } }), 0),
      this.safe(() => this.prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 5,
      }), []),
      this.safe(() => this.prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }), []),
      this.safe(() => this.prisma.department.findMany({
        include: { _count: { select: { employees: { where: { status: 'ACTIVE' as any } } } } },
      }), []),
      this.safe(() => this.prisma.employee.groupBy({
        by: ['status'],
        _count: { status: true },
      }), []),
      this.safe(async () => this.prisma.$queryRaw`
        SELECT id, "firstName", "lastName", "employeeCode", "dateOfBirth",
               "profilePhoto", dpt.name as "departmentName"
        FROM "Employee" e
        LEFT JOIN "Department" dpt ON e."departmentId" = dpt.id
        WHERE e."dateOfBirth" IS NOT NULL
          AND EXTRACT(MONTH FROM e."dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM e."dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
          AND e.status = 'ACTIVE'
      `, []),
      // Upcoming birthdays (next 7 days, skip NULL dateOfBirth)
      this.safe(() => this.prisma.$queryRaw`
        SELECT id, "firstName", "lastName", "employeeCode", "dateOfBirth",
               "profilePhoto", dpt.name as "departmentName"
        FROM "Employee" e
        LEFT JOIN "Department" dpt ON e."departmentId" = dpt.id
        WHERE e."dateOfBirth" IS NOT NULL
          AND (
            (EXTRACT(MONTH FROM e."dateOfBirth") * 100 + EXTRACT(DAY FROM e."dateOfBirth"))
            BETWEEN
            (EXTRACT(MONTH FROM CURRENT_DATE) * 100 + EXTRACT(DAY FROM CURRENT_DATE) + 1)
            AND
            (EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days') * 100 + EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
          ) AND e.status = 'ACTIVE'
        ORDER BY EXTRACT(MONTH FROM "dateOfBirth"), EXTRACT(DAY FROM "dateOfBirth")
        LIMIT 10
      `, []),
    ]);

    return {
      overview: {
        totalEmployees,
        activeEmployees,
        newJoinees,
        totalDepartments,
        pendingLeaves,
        pendingReviews,
      },
      attendance: {
        today: { present: todayPresent, absent: todayAbsent },
      },
      payroll: {
        month,
        year,
        totalPayroll: monthPayroll._sum.netSalary || 0,
        processedCount: monthPayroll._count,
      },
      upcomingHolidays,
      recentAnnouncements,
      departmentDistribution: deptDistribution.map((d) => ({
        id: d.id,
        name: d.name,
        count: d._count.employees,
      })),
      employeeStatusBreakdown: empStatusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      todayBirthdays,
      upcomingBirthdays,
    };
  }

  async getEmployeeDashboard(employeeId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      todayAttendance,
      leaveBalances,
      pendingLeaves,
      recentAttendance,
      myPayslip,
      upcomingHolidays,
      announcements,
      myReviews,
      myDocuments,
    ] = await Promise.all([
      this.prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } }),
      this.prisma.leaveBalance.findMany({ where: { employeeId, year } }),
      this.prisma.leave.count({ where: { employeeId, status: LeaveStatus.PENDING } }),
      this.prisma.attendance.findMany({
        where: { employeeId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      this.prisma.payroll.findFirst({
        where: { employeeId, month, year },
        orderBy: { createdAt: 'desc' },
      }),
      this.safe(() => this.prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 5,
      }), []),
      this.prisma.announcement.findMany({
        where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }),
      this.safe(() => this.prisma.performanceReview.findMany({
        where: { revieweeId: employeeId },
        orderBy: { reviewDate: 'desc' },
        take: 3,
        include: { reviewer: { select: { firstName: true, lastName: true } } },
      }), []),
      this.prisma.employeeDocument.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Profile completion score
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        phone: true, dateOfBirth: true, gender: true, address: true, city: true,
        state: true, pincode: true, bloodGroup: true, maritalStatus: true,
        bankName: true, accountNumber: true, ifscCode: true,
        panNumber: true, aadhaarNumber: true, emergencyContact: true, emergencyPhone: true,
        profilePhoto: true,
      },
    });
    const profileFields = emp ? Object.values(emp) : [];
    const filled = profileFields.filter(v => v !== null && v !== undefined && v !== '').length;
    const profileCompletion = Math.round((filled / profileFields.length) * 100);

    // Doc completion
    const docTypes = ['AADHAAR', 'PAN_CARD', 'DEGREE_CERTIFICATE', 'RESUME', 'BANK_DETAILS'];
    const uploadedTypes = myDocuments.filter(d => d.status !== 'REJECTED').map(d => d.type);
    const docCompletion = Math.round(
      (docTypes.filter(t => uploadedTypes.includes(t as any)).length / docTypes.length) * 100
    );
    const overallCompletion = Math.round((profileCompletion + docCompletion) / 2);

    return {
      attendance: {
        today: todayAttendance,
        checkedIn: !!todayAttendance?.checkIn,
        checkedOut: !!todayAttendance?.checkOut,
      },
      leaveBalances,
      pendingLeaves,
      recentAttendance,
      currentMonthPayslip: myPayslip,
      upcomingHolidays,
      announcements,
      recentReviews: myReviews,
      myDocuments,
      profileCompletion,
      docCompletion,
      overallCompletion,
    };
  }
}
