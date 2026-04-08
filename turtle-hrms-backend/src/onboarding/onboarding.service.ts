import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role, LeaveType } from '@prisma/client';

const ONBOARDING_TASKS = [
  { task: 'Offer Letter Sent', order: 1 },
  { task: 'Documents Collected', order: 2 },
  { task: 'Documents Verified', order: 3 },
  { task: 'Laptop / System Assigned', order: 4 },
  { task: 'Access Card Issued', order: 5 },
  { task: 'Email Account Created', order: 6 },
  { task: 'HRMS Account Created', order: 7 },
  { task: 'Induction Completed', order: 8 },
  { task: 'Team Introduction Done', order: 9 },
  { task: 'Onboarding Complete', order: 10 },
];

const OFFBOARDING_TASKS = [
  { task: 'Resignation Received', order: 1 },
  { task: 'Notice Period Started', order: 2 },
  { task: 'Knowledge Transfer Done', order: 3 },
  { task: 'Laptop Returned', order: 4 },
  { task: 'Access Card Returned', order: 5 },
  { task: 'Email Access Revoked', order: 6 },
  { task: 'Full & Final Settlement', order: 7 },
  { task: 'Experience Letter Issued', order: 8 },
  { task: 'Employee Deactivated', order: 9 },
];

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) { }

  // ─── Onboarding ────────────────────────────────────────────────────────────
  async getAllOnboarding() {
    const employees = await this.prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'INACTIVE'] } },
      select: {
        id: true, firstName: true, lastName: true, employeeCode: true,
        jobTitle: true, joiningDate: true,
        department: { select: { name: true } },
        onboardingTasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { joiningDate: 'desc' },
    });
    return employees.map(e => {
      const completed = e.onboardingTasks.filter(t => t.isCompleted).length;
      const total = e.onboardingTasks.length;
      return { ...e, progress: total ? Math.round((completed / total) * 100) : 0, completed, total };
    });
  }

  async getEmployeeOnboarding(employeeId: string) {
    let tasks = await this.prisma.onboardingTask.findMany({ where: { employeeId }, orderBy: { order: 'asc' } });
    if (!tasks.length) {
      await this.prisma.onboardingTask.createMany({ data: ONBOARDING_TASKS.map(t => ({ ...t, employeeId })) });
      tasks = await this.prisma.onboardingTask.findMany({ where: { employeeId }, orderBy: { order: 'asc' } });
    }
    const completed = tasks.filter(t => t.isCompleted).length;
    return { tasks, progress: Math.round((completed / tasks.length) * 100), total: tasks.length, completed };
  }

  async completeOnboardingTask(taskId: string, completedBy: string) {
    return this.prisma.onboardingTask.update({ where: { id: taskId }, data: { isCompleted: true, completedAt: new Date(), completedBy } });
  }

  async uncompleteOnboardingTask(taskId: string) {
    return this.prisma.onboardingTask.update({ where: { id: taskId }, data: { isCompleted: false, completedAt: null, completedBy: null } });
  }

  // ─── Offboarding ───────────────────────────────────────────────────────────
  async getAllOffboarding() {
    const employees = await this.prisma.employee.findMany({
      where: { status: 'RESIGNED' },
      select: {
        id: true, firstName: true, lastName: true, employeeCode: true,
        jobTitle: true, relievingDate: true, resignationReason: true, offboardingRemarks: true,
        joiningDate: true,
        manager: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
        offboardingTasks: { select: { isCompleted: true }, orderBy: { order: 'asc' } },
      },
    });
    return employees.map(e => {
      const completed = e.offboardingTasks.filter(t => t.isCompleted).length;
      const total = e.offboardingTasks.length;
      return { ...e, progress: total ? Math.round((completed / total) * 100) : 0, completed, total };
    });
  }

  async getEmployeeOffboarding(employeeId: string) {
    let tasks = await this.prisma.offboardingTask.findMany({ where: { employeeId }, orderBy: { order: 'asc' } });
    if (!tasks.length) {
      await this.prisma.offboardingTask.createMany({ data: OFFBOARDING_TASKS.map(t => ({ ...t, employeeId })) });
      tasks = await this.prisma.offboardingTask.findMany({ where: { employeeId }, orderBy: { order: 'asc' } });
    }
    const completed = tasks.filter(t => t.isCompleted).length;
    return { tasks, progress: Math.round((completed / tasks.length) * 100), total: tasks.length, completed };
  }

  async initOffboarding(employeeId: string, body?: { relievingDate?: string; reason?: string; remarks?: string }) {
    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: 'RESIGNED',
        relievingDate: body?.relievingDate ? new Date(body.relievingDate) : undefined,
        resignationReason: body?.reason || undefined,
        offboardingRemarks: body?.remarks || undefined,
      },
    });
    return this.getEmployeeOffboarding(employeeId);
  }

  async completeOffboardingTask(taskId: string, completedBy: string) {
    return this.prisma.offboardingTask.update({ where: { id: taskId }, data: { isCompleted: true, completedAt: new Date(), completedBy } });
  }

  // ─── Excel Import ──────────────────────────────────────────────────────────
  async importFromExcel(rows: any[]) {
    const results: any[] = [];
    const year = new Date().getFullYear().toString().slice(-2);

    for (const row of rows) {
      try {
        // Find or get department (default to Data Processing)
        let dept = await this.prisma.department.findFirst({ where: { code: 'DP' } });
        if (!dept) dept = await this.prisma.department.findFirst();
        if (!dept) throw new Error('No department found');

        const empCode = row.empId?.toString() || `TB${year}${String(Date.now()).slice(-4)}`;

        // Check if employee already exists
        const existing = await this.prisma.employee.findFirst({ where: { OR: [{ employeeCode: empCode }, { phone: row.phone?.toString() }] } });
        if (existing) {
          // Update existing employee with new data from Excel
          const updated = await this.prisma.employee.update({
            where: { id: existing.id },
            data: {
              bloodGroup: row.bloodGroup || undefined,
              dateOfBirth: row.dob ? new Date(row.dob) : undefined,
              maritalStatus: row.maritalStatus || undefined,
              emergencyContact: row.emergencyContact?.toString() || undefined,
            },
          });
          results.push({ empCode, name: `${existing.firstName} ${existing.lastName}`, status: 'updated', id: existing.id });
          continue;
        }

        // Parse name: "First Last" → split
        const nameParts = (row.name || '').trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Generate email
        const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '').replace(/\.+/g, '.');
        const email = row.email || `${slug}@turtlebytes.in`;

        // Check email collision
        const emailExists = await this.prisma.employee.findUnique({ where: { email } });
        const finalEmail = emailExists ? `${slug}.${empCode}@turtlebytes.in` : email;

        const password = `Pass@${empCode}`;
        const hashed = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
          data: { email: finalEmail, password: hashed, role: Role.EMPLOYEE },
        });

        const employee = await this.prisma.employee.create({
          data: {
            employeeCode: empCode,
            firstName,
            lastName,
            email: finalEmail,
            phone: row.phone?.toString() || null,
            dateOfBirth: row.dob ? new Date(row.dob) : null,
            bloodGroup: row.bloodGroup || null,
            jobTitle: row.designation || 'Data Processor',
            joiningDate: row.doj ? new Date(row.doj) : new Date(),
            maritalStatus: row.maritalStatus || null,
            emergencyContact: row.emergencyContact?.toString() || null,
            departmentId: dept.id,
            userId: user.id,
          },
        });

        // Leave balances
        const currentYear = new Date().getFullYear();
        await this.prisma.leaveBalance.createMany({
          data: [
            { employeeId: employee.id, year: currentYear, leaveType: LeaveType.ANNUAL, allocated: 18 },
            { employeeId: employee.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12 },
            { employeeId: employee.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6 },
            { employeeId: employee.id, year: currentYear, leaveType: LeaveType.SICK, allocated: 12 },
            { employeeId: employee.id, year: currentYear, leaveType: LeaveType.CASUAL, allocated: 6 },
          ],
        });

        // Auto-create onboarding tasks
        await this.prisma.onboardingTask.createMany({
          data: ONBOARDING_TASKS.map(t => ({ ...t, employeeId: employee.id })),
        });

        results.push({ empCode, name: `${firstName} ${lastName}`, status: 'created', email: finalEmail, password, id: employee.id });
      } catch (err: any) {
        results.push({ empCode: row.empId, name: row.name, status: 'error', error: err.message });
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const errors = results.filter(r => r.status === 'error').length;
    return { results, summary: { total: rows.length, created, updated, errors } };
  }
}