import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './employees.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Post('bulk-import')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  bulkImport(@Body() body: { rows: any[]; departmentId: string }) {
    return this.employeesService.bulkImportFromExcel(body.rows, body.departmentId);
  }

  @Get()
  findAll(@Query() filter: EmployeeFilterDto) {
    return this.employeesService.findAll(filter);
  }

  @Get('directory')
  getDirectory() {
    return this.employeesService.getDirectory();
  }

  @Get('org-chart')
  getOrgChart() {
    return this.employeesService.getOrgChart();
  }

  @Get('birthdays/today')
  getTodayBirthdays() {
    return this.employeesService.getTodayBirthdays();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
