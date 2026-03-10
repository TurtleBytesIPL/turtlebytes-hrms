import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { IsString, IsDateString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateHolidayDto extends PartialType(CreateHolidayDto) { }

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateHolidayDto) {
    const date = new Date(dto.date);
    const existing = await this.prisma.holiday.findUnique({ where: { date } });
    if (existing) throw new ConflictException('A holiday already exists on this date');

    return this.prisma.holiday.create({
      data: { ...dto, date, year: date.getFullYear() },
    });
  }

  async findAll(year?: number) {
    const y = year || new Date().getFullYear();
    return this.prisma.holiday.findMany({
      where: { year: y },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const h = await this.prisma.holiday.findUnique({ where: { id } });
    if (!h) throw new NotFoundException('Holiday not found');
    return h;
  }

  async update(id: string, dto: UpdateHolidayDto) {
    await this.findOne(id);
    return this.prisma.holiday.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.holiday.delete({ where: { id } });
    return { message: 'Holiday deleted' };
  }

  async getUpcoming(limit = 5) {
    const importantHolidays = [
      'Republic Day',
      'Independence Day',
      'Gandhi Jayanti',
      'Christmas',
      'New Year'
    ];

    return this.prisma.holiday.findMany({
      where: {
        date: { gte: new Date() },
        name: { in: importantHolidays }
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }
}
