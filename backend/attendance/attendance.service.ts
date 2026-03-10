import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckInDto, CheckOutDto, CreateAttendanceDto, UpdateAttendanceDto, AttendanceFilterDto } from './attendance.dto.js';
import { AttendanceStatus, Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(employeeId: string, dto: CheckInDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (existing?.checkIn) throw new ConflictException('Already checked in today');

    const now = new Date();
    const expectedStart = new Date();
    expectedStart.setHours(9, 0, 0, 0);

    const isLate = now > expectedStart;
    const lateMinutes = isLate ? Math.floor((now.getTime() - expectedStart.getTime()) / 60000) : 0;

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: now, isLate, lateMinutes, status: AttendanceStatus.PRESENT, notes: dto.notes },
      });
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
        status: AttendanceStatus.PRESENT,
        isLate,
        lateMinutes,
        notes: dto.notes,
      },
    });
  }

  async checkOut(employeeId: string, dto: CheckOutDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    if (!record?.checkIn) throw new BadRequestException('No check-in found for today');
    if (record.checkOut) throw new ConflictException('Already checked out today');

    const now = new Date();
    const workHours = (now.getTime() - record.checkIn.getTime()) / 3600000;
    const expectedHours = 9;
    const overtime = Math.max(0, workHours - expectedHours);

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut: now, workHours: parseFloat(workHours.toFixed(2)), overtime: parseFloat(overtime.toFixed(2)) },
    });
  }

  async findAll(filter: AttendanceFilterDto, user: any) {
    const { employeeId, month, year, startDate, endDate, status, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (user.role === Role.EMPLOYEE) {
      where.employeeId = user.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (year && month) {
      where.date = { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) };
    } else if (year) {
      where.date = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) };
    } else if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  async getTodayStatus(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });

    return {
      date: today,
      record,
      checkedIn: !!record?.checkIn,
      checkedOut: !!record?.checkOut,
    };
  }

  async getMonthSummary(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });

    const summary = {
      present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter((r) => r.isLate).length,
      halfDay: records.filter((r) => r.status === AttendanceStatus.HALF_DAY).length,
      onLeave: records.filter((r) => r.status === AttendanceStatus.ON_LEAVE).length,
      totalWorkHours: records.reduce((acc, r) => acc + (r.workHours || 0), 0),
      totalOvertime: records.reduce((acc, r) => acc + (r.overtime || 0), 0),
      records,
    };

    return summary;
  }

  async create(dto: CreateAttendanceDto) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
    });
    if (existing) throw new ConflictException('Attendance record already exists for this date');

    return this.prisma.attendance.create({ data: { ...dto, date, checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined, checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined } });
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.attendance.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined, checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined, checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined },
    });
  }
}
