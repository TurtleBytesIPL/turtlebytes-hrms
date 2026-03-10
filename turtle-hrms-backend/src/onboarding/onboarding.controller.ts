import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OnboardingService } from './onboarding.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private svc: OnboardingService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  getAll() { return this.svc.getAllOnboarding(); }

  @Get('offboarding')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getAllOffboarding() { return this.svc.getAllOffboarding(); }

  @Get(':employeeId')
  getEmployee(@Param('employeeId') id: string) { return this.svc.getEmployeeOnboarding(id); }

  @Get(':employeeId/offboarding')
  getEmployeeOffboarding(@Param('employeeId') id: string) { return this.svc.getEmployeeOffboarding(id); }

  @Post('import-excel')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  importExcel(@Body() body: { rows: any[] }) { return this.svc.importFromExcel(body.rows); }

  @Post(':employeeId/offboarding/init')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  initOffboarding(@Param('employeeId') id: string) { return this.svc.initOffboarding(id); }

  @Patch('tasks/:taskId/complete')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  completeTask(@Param('taskId') id: string, @Request() req: any) { return this.svc.completeOnboardingTask(id, req.user.id); }

  @Patch('tasks/:taskId/uncomplete')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  uncompleteTask(@Param('taskId') id: string) { return this.svc.uncompleteOnboardingTask(id); }

  @Patch('offboarding/tasks/:taskId/complete')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  completeOffTask(@Param('taskId') id: string, @Request() req: any) { return this.svc.completeOffboardingTask(id, req.user.id); }
}
