import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service.js';
import { GeneratePayrollDto, BulkPayrollDto, UpdatePayrollStatusDto, PayrollFilterDto } from './payroll.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Post('generate')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  generate(@Body() dto: GeneratePayrollDto) { return this.payrollService.generate(dto); }

  @Post('bulk-generate')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  bulkGenerate(@Body() dto: BulkPayrollDto) { return this.payrollService.bulkGenerate(dto); }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  findAll(@Query() filter: PayrollFilterDto) { return this.payrollService.findAll(filter); }

  @Get('my-payslips')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE)
  getMyPayslips(@CurrentUser('employeeId') employeeId: string, @Query() filter: PayrollFilterDto) {
    return this.payrollService.findAll({ ...filter, employeeId });
  }

  @Get('salary-structures')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getSalaryStructures() { return this.payrollService.getSalaryStructures(); }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE)
  findOne(@Param('id') id: string) { return this.payrollService.findOne(id); }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePayrollStatusDto) {
    return this.payrollService.updateStatus(id, dto);
  }
}
