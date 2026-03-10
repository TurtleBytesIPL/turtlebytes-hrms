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

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('employee')
  getEmployeeDashboard(@CurrentUser('employeeId') employeeId: string) {
    return this.dashboardService.getEmployeeDashboard(employeeId);
  }

  @Get()
  getDashboard(@CurrentUser() user: any) {
    if (user.role === Role.SUPER_ADMIN || user.role === Role.HR_ADMIN) {
      return this.dashboardService.getAdminDashboard();
    }
    return this.dashboardService.getEmployeeDashboard(user.employeeId);
  }
}
