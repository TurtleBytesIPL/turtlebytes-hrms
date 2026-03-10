import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmployeeStatus, LeaveStatus, PayrollStatus, Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

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
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      this.prisma.employee.count({
        where: { joiningDate: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } },
      }),
      this.prisma.department.count(),
      this.prisma.leave.count({ where: { status: LeaveStatus.PENDING } }),
      this.prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
      this.prisma.attendance.count({ where: { date: today, status: 'ABSENT' } }),
      this.prisma.payroll.aggregate({
        where: { month, year, status: { not: PayrollStatus.DRAFT } },
        _sum: { netSalary: true },
        _count: true,
      }),
      this.prisma.performanceReview.count({ where: { status: { in: ['DRAFT', 'SUBMITTED'] } } }),
      this.prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      this.prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }),
      this.prisma.department.findMany({
        include: { _count: { select: { employees: { where: { status: 'ACTIVE' } } } } },
      }),
      this.prisma.employee.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
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
      this.prisma.holiday.findMany({
        where: { date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      this.prisma.announcement.findMany({
        where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        take: 5,
      }),
      this.prisma.performanceReview.findMany({
        where: { revieweeId: employeeId },
        orderBy: { reviewDate: 'desc' },
        take: 3,
        include: { reviewer: { select: { firstName: true, lastName: true } } },
      }),
    ]);

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
    };
  }
}
