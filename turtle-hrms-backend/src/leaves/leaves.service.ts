/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLeaveDto, ApproveLeaveDto, LeaveFilterDto } from './leaves.dto.js';

// Use string literals to avoid @prisma/client type errors before `prisma generate` is run
const LEAVE_STATUS = { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED', CANCELLED: 'CANCELLED' };
const LEAVE_TYPE   = { SICK: 'SICK', CASUAL: 'CASUAL' };
const LEAVE_LIMITS: Record<string, number> = { SICK: 12, CASUAL: 12 };

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
    const endDate   = new Date(dto.endDate);
    if (endDate < startDate) throw new BadRequestException('End date must be after start date');

    const totalDays = this.calculateWorkingDays(startDate, endDate, dto.isHalfDay || false);
    const year      = startDate.getFullYear();
    const limit     = LEAVE_LIMITS[dto.leaveType as string];

    if (limit !== undefined) {
      let balance = await (this.prisma as any).leaveBalance.findUnique({
        where: { employeeId_leaveType_year: { employeeId, leaveType: dto.leaveType, year } },
      });
      if (!balance) {
        balance = await (this.prisma as any).leaveBalance.create({
          data: { employeeId, leaveType: dto.leaveType, year, allocated: limit, remaining: limit, used: 0, pending: 0 },
        });
      }
      const available = (balance.remaining ?? balance.allocated - balance.used) - balance.pending;
      if (available < totalDays) {
        throw new BadRequestException(
          `Insufficient ${String(dto.leaveType).toLowerCase()} leave balance. Available: ${available} days`,
        );
      }
    }

    const overlap = await (this.prisma as any).leave.findFirst({
      where: {
        employeeId,
        status: { in: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED] },
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
    });
    if (overlap) throw new BadRequestException('You have an overlapping leave request');

    const leave = await (this.prisma as any).leave.create({
      data: { employeeId, leaveType: dto.leaveType, startDate, endDate, totalDays, isHalfDay: dto.isHalfDay || false, reason: dto.reason },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });

    if (limit !== undefined) {
      await (this.prisma as any).leaveBalance.updateMany({
        where: { employeeId, leaveType: dto.leaveType, year },
        data: { pending: { increment: totalDays } },
      });
    }
    return leave;
  }

  async findAll(filter: LeaveFilterDto, user: any) {
    const { employeeId, leaveType, status, year, month, page = 1, limit = 20 } = filter;
    const skip  = (page - 1) * limit;
    const where: any = {};

    if (user.role === 'EMPLOYEE') {
      where.employeeId = user.employeeId;
    } else if (user.role === 'TEAM_LEAD') {
      const team = await (this.prisma as any).team.findFirst({
        where: { leadId: user.employeeId },
        include: { members: { select: { id: true } } },
      });
      const ids = team ? team.members.map((m: any) => m.id) : [];
      where.employeeId = employeeId || { in: ids };
    } else if (user.role === 'MANAGER') {
      const reportees = await (this.prisma as any).employee.findMany({
        where: { managerId: user.employeeId }, select: { id: true },
      });
      where.employeeId = employeeId || { in: [user.employeeId, ...reportees.map((e: any) => e.id)] };
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (leaveType) where.leaveType = leaveType;
    if (status) where.status = status;
    if (year) { where.startDate = { gte: new Date(`${year}-01-01`) }; where.endDate = { lte: new Date(`${year}-12-31`) }; }
    if (month && year) {
      where.startDate = { lte: new Date(year, Number(month), 0) };
      where.endDate   = { gte: new Date(year, Number(month) - 1, 1) };
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).leave.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
        skip, take: Number(limit), orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).leave.count({ where }),
    ]);
    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const leave = await (this.prisma as any).leave.findUnique({
      where: { id },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
    if (!leave) throw new NotFoundException('Leave not found');
    return leave;
  }

  async approve(id: string, approverId: string, dto: ApproveLeaveDto) {
    const leave = await this.findOne(id);
    if (leave.status !== LEAVE_STATUS.PENDING) throw new BadRequestException('Leave is no longer pending');

    const updated = await (this.prisma as any).leave.update({
      where: { id },
      data: { status: dto.status, approvedById: approverId, approvedAt: new Date(), remarks: dto.remarks },
    });

    const year  = leave.startDate.getFullYear();
    const limit = LEAVE_LIMITS[leave.leaveType as string];
    if (limit !== undefined) {
      if (dto.status === LEAVE_STATUS.APPROVED) {
        await (this.prisma as any).leaveBalance.updateMany({
          where: { employeeId: leave.employeeId, leaveType: leave.leaveType, year },
          data: { pending: { decrement: leave.totalDays }, used: { increment: leave.totalDays }, remaining: { decrement: leave.totalDays } },
        });
      } else {
        await (this.prisma as any).leaveBalance.updateMany({
          where: { employeeId: leave.employeeId, leaveType: leave.leaveType, year },
          data: { pending: { decrement: leave.totalDays } },
        });
      }
    }
    return updated;
  }

  async cancel(id: string, employeeId: string) {
    const leave = await this.findOne(id);
    if (leave.employeeId !== employeeId) throw new ForbiddenException();
    if (leave.status !== LEAVE_STATUS.PENDING) throw new BadRequestException('Only pending leaves can be cancelled');

    const updated = await (this.prisma as any).leave.update({ where: { id }, data: { status: LEAVE_STATUS.CANCELLED } });
    const year  = leave.startDate.getFullYear();
    const limit = LEAVE_LIMITS[leave.leaveType as string];
    if (limit !== undefined) {
      await (this.prisma as any).leaveBalance.updateMany({
        where: { employeeId, leaveType: leave.leaveType, year },
        data: { pending: { decrement: leave.totalDays } },
      });
    }
    return updated;
  }

async getBalances(employeeId: string, year?: number) {
  const y = year || new Date().getFullYear();

  let balances = await (this.prisma as any).leaveBalance.findMany({
    where: { employeeId, year: y },
    orderBy: { leaveType: 'asc' },
  });

  const limits: any = {
    ANNUAL: 24,
    SICK: 12,
    CASUAL: 12,
  };

  for (const type of ['ANNUAL', 'SICK', 'CASUAL']) {
    const existing = balances.find((b: any) => b.leaveType === type);

    if (!existing) {
      const days = limits[type];

      const nb = await (this.prisma as any).leaveBalance.create({
        data: {
          employeeId,
          leaveType: type,
          year: y,
          allocated: days,
          remaining: days,
          used: 0,
          pending: 0,
        },
      });

      balances.push(nb);
    } else {
      // 🔧 FORCE UPDATE if incorrect values exist
      const correctDays = limits[type];

      if (existing.allocated !== correctDays) {
        await (this.prisma as any).leaveBalance.update({
          where: { id: existing.id },
          data: {
            allocated: correctDays,
            remaining: correctDays - existing.used,
          },
        });

        existing.allocated = correctDays;
        existing.remaining = correctDays - existing.used;
      }
    }
  }

  return balances;

  }

  async ensureBalancesForAll(year: number) {
    const employees = await (this.prisma as any).employee.findMany({ select: { id: true } });
    for (const emp of employees) {
      for (const type of ['SICK', 'CASUAL']) {
        await (this.prisma as any).leaveBalance.upsert({
          where:  { employeeId_leaveType_year: { employeeId: emp.id, leaveType: type, year } },
          update: {},
          create: { employeeId: emp.id, leaveType: type, year, allocated: 12, remaining: 12, used: 0, pending: 0 },
        });
      }
    }
    return { message: `Leave balances ensured for ${employees.length} employees` };
  }
}