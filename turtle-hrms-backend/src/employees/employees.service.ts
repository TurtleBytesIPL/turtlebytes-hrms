import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './employees.dto.js';
import * as bcrypt from 'bcrypt';
import { Role, LeaveType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) { }

  private get includeRelations() {
    return {
      department: { select: { id: true, name: true, code: true } },
      manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeCode: true } },
      user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true } },
      _count: { select: { reportees: true } },
    };
  }

  private generateEmployeeCode(empIdFromExcel?: string | number): string {
    if (empIdFromExcel) {
      return String(empIdFromExcel);
    }
    return `TB${Date.now()}`;
  }

  private autoDetectRole(jobTitle: string): Role {
    const title = jobTitle.toLowerCase();
    if (title.includes('hr') || title.includes('human resource') || title.includes('recruiter')) return Role.HR_ADMIN;
    if (title.includes('manager') || title.includes('head') || title.includes('director') || title.includes('coo') || title.includes('ceo') || title.includes('lead')) return Role.MANAGER;
    return Role.EMPLOYEE;
  }

  private async initLeaveBalances(employeeId: string) {
    const year = new Date().getFullYear();
    await this.prisma.leaveBalance.createMany({
      data: [
        { employeeId, year, leaveType: LeaveType.ANNUAL, allocated: 21 },
        { employeeId, year, leaveType: LeaveType.SICK, allocated: 12 },
        { employeeId, year, leaveType: LeaveType.CASUAL, allocated: 6 },
        { employeeId, year, leaveType: LeaveType.UNPAID, allocated: 0 },
      ],
      skipDuplicates: true,
    });
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Employee with this email already exists');

    const count = await this.prisma.employee.count();
    const year = new Date().getFullYear().toString().slice(-2);
    const employeeCode = `TB${year}${String(count + 1).padStart(4, '0')}`;

    const password = dto.password || `Pass@${employeeCode}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = this.autoDetectRole(dto.jobTitle);

    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashedPassword, role },
    });

    const { password: _, ...employeeData } = dto;

    // Strip empty UUID fields to prevent Prisma validation errors
    if (!employeeData.managerId) delete (employeeData as any).managerId;

    const employee = await this.prisma.employee.create({
      data: {
        ...employeeData,
        employeeCode,
        joiningDate: new Date(dto.joiningDate),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        probationEndDate: dto.probationEndDate ? new Date(dto.probationEndDate) : undefined,
        userId: user.id,
      },
      include: this.includeRelations,
    });

    await this.initLeaveBalances(employee.id);

    return { employee, credentials: { email: dto.email, password, employeeCode, role } };
  }

  async bulkImportFromExcel(rows: any[], defaultDepartmentId: string) {
    const results: { success: any[]; failed: any[] } = { success: [], failed: [] };

    for (const row of rows) {
      try {
        // Parse name: "FirstName LastName" or "FirstName.LastName"
        const firstName = row.firstName || String(row.name || '').split(/[\s.]+/)[0] || 'Unknown';
        const lastName = row.lastName || String(row.name || '').split(/[\s.]+/).slice(1).join(' ') || '-';
        const fullName = `${firstName} ${lastName}`.trim();

        const email = row.email || `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@turtlebytes.in`;
        const employeeCode = row.empId ? String(row.empId) : `TB${Date.now()}`;

        // Check for existing — skip if already seeded with same empId or email
        const existing = await this.prisma.employee.findFirst({
          where: { OR: [{ email }, { employeeCode }] },
        });
        if (existing) {
          results.failed.push({ name: fullName, reason: 'Already exists (skipped)' });
          continue;
        }

        const jobTitle = row.jobTitle || row.designation || 'Employee';
        const role = this.autoDetectRole(jobTitle);
        const password = `Pass@${employeeCode}`;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
          data: { email, password: hashedPassword, role },
        });

        const employee = await this.prisma.employee.create({
          data: {
            employeeCode,
            firstName,
            lastName,
            email,
            phone: row.phone ? String(row.phone) : undefined,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
            bloodGroup: row.bloodGroup || undefined,
            maritalStatus: row.maritalStatus || undefined,
            jobTitle,
            joiningDate: (row.joiningDate && row.joiningDate !== 'Invalid Date') ? new Date(row.joiningDate) : new Date(),
            departmentId: defaultDepartmentId,
            emergencyPhone: row.emergencyPhone || (row.emergencyContact ? String(row.emergencyContact) : undefined),
            userId: user.id,
          },
        });

        await this.initLeaveBalances(employee.id);

        results.success.push({
          name: `${firstName} ${lastName}`,
          email,
          password,
          employeeCode,
        });
      } catch (err: any) {
        results.failed.push({ name: row.name || 'Unknown', reason: err.message });
      }
    }

    return results;
  }

  async findAll(filter: EmployeeFilterDto) {
    const { search, departmentId, status, employmentType, page = 1, limit = 20 } = filter;
    const sort = (filter as any).sort || 'createdAt';
    const order = (filter as any).order || 'desc';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;

    // Safe sort fields to prevent injection
    const allowedSorts = ['createdAt', 'joiningDate', 'firstName', 'lastName', 'employeeCode'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'createdAt';
    const safeOrder = order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: this.includeRelations,
        skip,
        take: Number(limit),
        orderBy: { [safeSort]: safeOrder },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees: data,
      data,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Profile Photo ────────────────────────────────────────────────────────
  async updateProfilePhoto(employeeId: string, file: any) {
    if (!file) throw new Error('No file uploaded');
    // Delete old photo file if exists
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { profilePhoto: true } });
    if (emp?.profilePhoto) {
      const oldFilename = emp.profilePhoto.split('/').pop();
      const oldPath = path.join(process.cwd(), 'uploads', 'photos', oldFilename!);
      if (oldFilename && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const photoUrl = `/api/v1/employees/photo/${file.filename}`;
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { profilePhoto: photoUrl },
      select: { id: true, profilePhoto: true },
    });
  }

  async deleteProfilePhoto(employeeId: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId }, select: { profilePhoto: true } });
    if (emp?.profilePhoto) {
      const filename = emp.profilePhoto.split('/').pop();
      const filepath = path.join(process.cwd(), 'uploads', 'photos', filename!);
      if (filename && fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { profilePhoto: null },
      select: { id: true, profilePhoto: true },
    });
  }

  // ─── Serve Photo ──────────────────────────────────────────────────────────
  getPhotoPath(filename: string): string {
    const filepath = path.join(process.cwd(), 'uploads', 'photos', filename);
    if (!fs.existsSync(filepath)) throw new Error('Photo not found');
    return filepath;
  }

  async getByDepartment(departmentId: string) {
    return this.prisma.employee.findMany({
      where: { departmentId },
      orderBy: { firstName: 'asc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        ...this.includeRelations,
        reportees: { select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeCode: true, profilePhoto: true } },
        leaveBalances: { where: { year: new Date().getFullYear() } },
        assets: { where: { status: 'ASSIGNED' } },
        documents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const { password, ...updateData } = dto as any;

    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...updateData,
        joiningDate: updateData.joiningDate ? new Date(updateData.joiningDate) : undefined,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
        probationEndDate: updateData.probationEndDate ? new Date(updateData.probationEndDate) : undefined,
      },
      include: this.includeRelations,
    });

    return employee;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
    return { message: 'Employee terminated successfully' };
  }

  async getOrgChart() {
    return this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, firstName: true, lastName: true, jobTitle: true,
        employeeCode: true, profilePhoto: true, managerId: true,
        department: { select: { name: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getDirectory() {
    return this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, firstName: true, lastName: true, jobTitle: true,
        email: true, phone: true, employeeCode: true, profilePhoto: true,
        department: { select: { name: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  // Birthday notifications
  async getTodayBirthdays() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    return this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        dateOfBirth: { not: null },
      },
      select: {
        id: true, firstName: true, lastName: true, profilePhoto: true, dateOfBirth: true,
        department: { select: { name: true } },
      },
    }).then(emps => emps.filter(e => {
      if (!e.dateOfBirth) return false;
      const dob = new Date(e.dateOfBirth);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    }));
  }
}