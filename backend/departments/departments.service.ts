import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto.js';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({ where: { OR: [{ code: dto.code }, { name: dto.name }] } });
    if (existing) throw new ConflictException('Department name or code already exists');
    return this.prisma.department.create({
      data: dto,
      include: { head: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        head: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
        employees: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true, employeeCode: true, status: true },
          where: { status: 'ACTIVE' },
        },
        _count: { select: { employees: true } },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: dto,
      include: { head: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    const empCount = await this.prisma.employee.count({ where: { departmentId: id, status: 'ACTIVE' } });
    if (empCount > 0) throw new ConflictException('Cannot delete department with active employees');
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted successfully' };
  }
}
