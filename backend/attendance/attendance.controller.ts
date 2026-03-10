import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { CheckInDto, CheckOutDto, CreateAttendanceDto, UpdateAttendanceDto, AttendanceFilterDto } from './attendance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

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
  getMonthSummary(
    @CurrentUser('employeeId') employeeId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    const now = new Date();
    return this.attendanceService.getMonthSummary(
      employeeId,
      month || now.getMonth() + 1,
      year || now.getFullYear(),
    );
  }

  @Get('summary/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  getEmployeeSummary(
    @Param('employeeId') employeeId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    const now = new Date();
    return this.attendanceService.getMonthSummary(
      employeeId,
      month || now.getMonth() + 1,
      year || now.getFullYear(),
    );
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
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
