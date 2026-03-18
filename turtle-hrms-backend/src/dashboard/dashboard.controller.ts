import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // ADMIN + TEAM LEAD dashboard
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  // EMPLOYEE dashboard
  @Get('employee')
  getEmployeeDashboard(@CurrentUser('employeeId') employeeId: string) {
    return this.dashboardService.getEmployeeDashboard(employeeId);
  }

  // AUTO dashboard routing
  @Get()
  getDashboard(@CurrentUser() user: any) {

    // ADMIN / HR / TEAM LEAD → Admin Dashboard
    if (
  user.role === Role.SUPER_ADMIN ||
  user.role === Role.HR_ADMIN ||
  user.role === Role.MANAGER
) {
      return this.dashboardService.getAdminDashboard();
    }

    // EMPLOYEE → Employee Dashboard
    return this.dashboardService.getEmployeeDashboard(user.employeeId);
  }
}