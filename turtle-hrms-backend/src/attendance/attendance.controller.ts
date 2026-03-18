import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { CheckInDto, CheckOutDto, CreateAttendanceDto, UpdateAttendanceDto, AttendanceFilterDto } from './attendance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';
import type { Response } from 'express';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@CurrentUser('employeeId') employeeId: string, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(employeeId, dto);
  }

  @Post('check-out')
  checkOut(@CurrentUser('employeeId') employeeId: string, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(employeeId, dto);
  }

  @Get('today')
  getTodayStatus(@CurrentUser('employeeId') employeeId: string) {
    return this.attendanceService.getTodayStatus(employeeId);
  }

  @Get('summary')
  getMonthSummary(@CurrentUser('employeeId') employeeId: string, @Query('month') month: number, @Query('year') year: number) {
    const now = new Date();
    return this.attendanceService.getMonthSummary(employeeId, month || now.getMonth() + 1, year || now.getFullYear());
  }

  @Get('summary/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD, Role.MANAGER)
  getEmployeeSummary(@Param('employeeId') employeeId: string, @Query('month') month: number, @Query('year') year: number) {
    const now = new Date();
    return this.attendanceService.getMonthSummary(employeeId, month || now.getMonth() + 1, year || now.getFullYear());
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD)
  approve(@Param('id') id: string, @CurrentUser('employeeId') approverId: string, @CurrentUser() user: any) {
    return this.attendanceService.approve(id, approverId, user);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD)
  reject(@Param('id') id: string, @Body('reason') reason: string, @CurrentUser('employeeId') approverId: string, @CurrentUser() user: any) {
    return this.attendanceService.reject(id, approverId, reason || 'Rejected', user);
  }

  @Get('report')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getReport(@Query('type') type: string, @Query('date') date: string, @Query('month') month: number, @Query('year') year: number, @Query('week') week: string) {
    return this.attendanceService.getReport({ type, date, month, year, week });
  }

  @Get('report/csv')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  async downloadReport(@Query('type') type: string, @Query('date') date: string, @Query('month') month: number, @Query('year') year: number, @Res() res: Response) {
    const csv = await this.attendanceService.getReportCSV({ type, date, month, year });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-report.csv"`);
    res.send(csv);
  }

  @Get('report/employee/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD, Role.MANAGER)
  getEmployeeReport(@Param('employeeId') employeeId: string, @Query('type') type: string, @Query('month') month: number, @Query('year') year: number, @Query('date') date: string) {
    return this.attendanceService.getReport({ type: type || 'monthly', date, month, year, employeeId });
  }

  @Get('report/employee/:employeeId/csv')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD, Role.MANAGER)
  async downloadEmployeeReport(@Param('employeeId') employeeId: string, @Query('type') type: string, @Query('month') month: number, @Query('year') year: number, @Query('date') date: string, @Res() res: Response) {
    const csv = await this.attendanceService.getReportCSV({ type: type || 'monthly', date, month, year, employeeId });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-employee.csv"`);
    res.send(csv);
  }

  @Get()
  findAll(@Query() filter: AttendanceFilterDto, @CurrentUser() user: any) {
    return this.attendanceService.findAll(filter, user);
  }

  @Post('manual')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.TEAM_LEAD)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.update(id, dto, user);
  }
}
