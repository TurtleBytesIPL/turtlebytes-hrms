import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeaveDto, ApproveLeaveDto, LeaveFilterDto } from './leaves.dto.js';
import { LeaveStatus, Role } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  private calculateWorkingDays(start: Date, end: Date, isHalfDay: boolean): number {
    if (isHalfDay) return 0.5;
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  async create(employeeId: string, dto: CreateLeaveDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) throw new BadRequestException('End date must be after start date');

    const totalDays = this.calculateWorkingDays(startDate, endDate, dto.isHalfDay || false);

    // Check leave balance
    const year = startDate.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId, leaveType: dto.leaveType, year } },
    });

    const available = balance ? balance.allocated + balance.carried - balance.used - balance.pending : 0;
    if (available < totalDays) {
      throw new BadRequestException(`Insufficient leave balance. Available: ${available} days`);
    }

    // Check overlapping leaves
    const overlap = await this.prisma.leave.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
    if (overlap) throw new BadRequestException('You have an overlapping leave request');

    const leave = await this.prisma.leave.create({
      data: {
        employeeId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        totalDays,
        isHalfDay: dto.isHalfDay || false,
        reason: dto.reason,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });

    // Update pending balance
    if (balance) {
      await this.prisma.leaveBalance.update({
        where: { employeeId_leaveType_year: { employeeId, leaveType: dto.leaveType, year } },
        data: { pending: { increment: totalDays } },
      });
    }

    return leave;
  }

  async findAll(filter: LeaveFilterDto, user: any) {
    const { employeeId, leaveType, status, year, month, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Employees can only see their own leaves
    if (user.role === Role.EMPLOYEE) {
      where.employeeId = user.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    // Manager sees team leaves
    if (user.role === Role.MANAGER && !employeeId) {
      const teamIds = await this.prisma.employee.findMany({
        where: { managerId: user.employee?.id },
        select: { id: true },
      });
      where.employeeId = { in: [user.employeeId, ...teamIds.map((e) => e.id)] };
    }

    if (leaveType) where.leaveType = leaveType;
    if (status) where.status = status;

    if (year) {
      where.startDate = { gte: new Date(`${year}-01-01`) };
      where.endDate = { lte: new Date(`${year}-12-31`) };
    }

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      where.startDate = { lte: endOfMonth };
      where.endDate = { gte: startOfMonth };
    }

    const [data, total] = await Promise.all([
      this.prisma.leave.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leave.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({
      where: { id },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async approve(id: string, approverId: string, dto: ApproveLeaveDto) {
    const leave = await this.findOne(id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave is no longer pending');
    }

    const updated = await this.prisma.leave.update({
      where: { id },
      data: { status: dto.status, approvedById: approverId, approvedAt: new Date(), remarks: dto.remarks },
    });

    const year = leave.startDate.getFullYear();

    if (dto.status === LeaveStatus.APPROVED) {
      await this.prisma.leaveBalance.update({
        where: { employeeId_leaveType_year: { employeeId: leave.employeeId, leaveType: leave.leaveType, year } },
        data: { pending: { decrement: leave.totalDays }, used: { increment: leave.totalDays } },
      });
    } else if (dto.status === LeaveStatus.REJECTED || dto.status === LeaveStatus.CANCELLED) {
      await this.prisma.leaveBalance.update({
        where: { employeeId_leaveType_year: { employeeId: leave.employeeId, leaveType: leave.leaveType, year } },
        data: { pending: { decrement: leave.totalDays } },
      });
    }

    return updated;
  }

  async cancel(id: string, employeeId: string) {
    const leave = await this.findOne(id);

    if (leave.employeeId !== employeeId) throw new ForbiddenException();
    if (leave.status !== LeaveStatus.PENDING) throw new BadRequestException('Only pending leaves can be cancelled');

    const updated = await this.prisma.leave.update({
      where: { id },
      data: { status: LeaveStatus.CANCELLED },
    });

    const year = leave.startDate.getFullYear();
    await this.prisma.leaveBalance.update({
      where: { employeeId_leaveType_year: { employeeId, leaveType: leave.leaveType, year } },
      data: { pending: { decrement: leave.totalDays } },
    });

    return updated;
  }

  async getBalances(employeeId: string, year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year: y },
      orderBy: { leaveType: 'asc' },
    });
  }
}
