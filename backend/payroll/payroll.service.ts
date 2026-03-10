import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeneratePayrollDto, BulkPayrollDto, UpdatePayrollStatusDto, PayrollFilterDto } from './payroll.dto.js';
import { PayrollStatus } from '@prisma/client';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  private calculatePayroll(ctc: number, structure: any, workingDays: number, paidDays: number, extra: Partial<GeneratePayrollDto>) {
    const monthly = ctc / 12;
    const basic = (monthly * structure.basicPercent) / 100;
    const hra = (monthly * structure.hraPercent) / 100;
    const conveyance = structure.conveyance;
    const medical = structure.medicalAllowance;
    const specialAllowance = monthly - basic - hra - conveyance - medical;
    const otherAllowances = extra.otherAllowances || 0;
    const grossSalary = basic + hra + conveyance + medical + Math.max(0, specialAllowance) + otherAllowances;

    // Deductions
    const pfDeduction = structure.pf ? basic * 0.12 : 0;
    const esiDeduction = structure.esi && grossSalary <= 21000 ? grossSalary * 0.0075 : 0;
    const professionalTax = 200; // standard PT in India
    const tds = 0; // simplified, real calc would consider tax slab
    const otherDeductions = extra.otherDeductions || 0;
    const totalDeductions = pfDeduction + esiDeduction + professionalTax + tds + otherDeductions;

    const lopDays = workingDays - paidDays;
    const lopDeduction = lopDays > 0 ? (grossSalary / workingDays) * lopDays : 0;
    const netSalary = grossSalary - totalDeductions - lopDeduction + (extra.bonus || 0) + (extra.incentives || 0);

    return {
      basicSalary: parseFloat(basic.toFixed(2)),
      hra: parseFloat(hra.toFixed(2)),
      conveyance: parseFloat(conveyance.toFixed(2)),
      medicalAllowance: parseFloat(medical.toFixed(2)),
      specialAllowance: parseFloat(Math.max(0, specialAllowance).toFixed(2)),
      otherAllowances: parseFloat(otherAllowances.toFixed(2)),
      grossSalary: parseFloat(grossSalary.toFixed(2)),
      pf: parseFloat(pfDeduction.toFixed(2)),
      esi: parseFloat(esiDeduction.toFixed(2)),
      professionalTax: parseFloat(professionalTax.toFixed(2)),
      tds: parseFloat(tds.toFixed(2)),
      otherDeductions: parseFloat(otherDeductions.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      lopDays: parseFloat(lopDays.toFixed(1)),
      netSalary: parseFloat(netSalary.toFixed(2)),
    };
  }

  async generate(dto: GeneratePayrollDto) {
    const existing = await this.prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: dto.employeeId, month: dto.month, year: dto.year } },
    });
    if (existing) throw new ConflictException('Payroll already generated for this month');

    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    // Get working days for the month
    const workingDays = this.getWorkingDays(dto.month, dto.year);

    // Get LOP days from attendance/leaves
    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0);
    const absences = await this.prisma.attendance.count({
      where: { employeeId: dto.employeeId, date: { gte: startDate, lte: endDate }, status: 'ABSENT' },
    });
    const paidDays = workingDays - absences;

    // Get salary structure
    let structure = dto.salaryStructureId
      ? await this.prisma.salaryStructure.findUnique({ where: { id: dto.salaryStructureId } })
      : await this.prisma.salaryStructure.findFirst({ where: { name: 'Standard' } });

    if (!structure) throw new BadRequestException('No salary structure found');

    const calc = this.calculatePayroll(dto.ctc, structure, workingDays, paidDays, dto);

    return this.prisma.payroll.create({
      data: {
        employeeId: dto.employeeId,
        salaryStructureId: structure.id,
        month: dto.month,
        year: dto.year,
        ctc: dto.ctc,
        workingDays,
        paidDays,
        bonus: dto.bonus || 0,
        incentives: dto.incentives || 0,
        remarks: dto.remarks,
        ...calc,
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
  }

  async bulkGenerate(dto: BulkPayrollDto) {
    const where: any = { status: 'ACTIVE' };
    if (dto.departmentId) where.departmentId = dto.departmentId;

    const employees = await this.prisma.employee.findMany({ where });
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const emp of employees) {
      try {
        const ctc = 600000; // Default CTC - in real world, stored per employee
        await this.generate({ employeeId: emp.id, month: dto.month, year: dto.year, ctc });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push(`${emp.employeeCode}: ${e.message}`);
      }
    }

    return results;
  }

  async findAll(filter: PayrollFilterDto) {
    const { employeeId, month, year, status, departmentId, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (status) where.status = status;
    if (departmentId) where.employee = { departmentId };

    const [data, total] = await Promise.all([
      this.prisma.payroll.findMany({
        where,
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
        skip,
        take: Number(limit),
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.payroll.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true } },
        salaryStructure: true,
      },
    });
    if (!payroll) throw new NotFoundException('Payroll record not found');
    return payroll;
  }

  async updateStatus(id: string, dto: UpdatePayrollStatusDto) {
    await this.findOne(id);
    const data: any = { status: dto.status };
    if (dto.status === PayrollStatus.PROCESSED) data.processedAt = new Date();
    if (dto.status === PayrollStatus.PAID) data.paidAt = new Date();

    return this.prisma.payroll.update({ where: { id }, data });
  }

  async getPayslip(id: string) {
    return this.findOne(id);
  }

  private getWorkingDays(month: number, year: number): number {
    let count = 0;
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) count++;
      date.setDate(date.getDate() + 1);
    }
    return count;
  }

  async getSalaryStructures() {
    return this.prisma.salaryStructure.findMany({ where: { isActive: true } });
  }
}
