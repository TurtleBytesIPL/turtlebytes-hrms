import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service.js';
import { CreateReviewDto, UpdateReviewDto, ReviewFilterDto } from './performance.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private performanceService: PerformanceService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  create(@CurrentUser('employeeId') reviewerId: string, @Body() dto: CreateReviewDto) {
    return this.performanceService.create(reviewerId, dto);
  }

  @Get()
  findAll(@Query() filter: ReviewFilterDto, @CurrentUser() user: any) {
    return this.performanceService.findAll(filter, user);
  }

  @Get('team')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  getTeamReviews(@CurrentUser('employeeId') managerId: string, @Query('period') period?: string) {
    return this.performanceService.getTeamReviews(managerId, period);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.performanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('employeeId') employeeId: string, @CurrentUser('role') role: Role, @Body() dto: UpdateReviewDto) {
    return this.performanceService.update(id, employeeId, role, dto);
  }
}
