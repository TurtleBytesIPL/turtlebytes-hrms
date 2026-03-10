import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LeavesService } from './leaves.service.js';
import { CreateLeaveDto, ApproveLeaveDto, LeaveFilterDto } from './leaves.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Post()
  create(@CurrentUser('employeeId') employeeId: string, @Body() dto: CreateLeaveDto) {
    return this.leavesService.create(employeeId, dto);
  }

  @Get()
  findAll(@Query() filter: LeaveFilterDto, @CurrentUser() user: any) {
    return this.leavesService.findAll(filter, user);
  }

  @Get('balances')
  getMyBalances(@CurrentUser('employeeId') employeeId: string, @Query('year') year?: number) {
    return this.leavesService.getBalances(employeeId, year);
  }

  @Get('balances/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  getBalances(@Param('employeeId') employeeId: string, @Query('year') year?: number) {
    return this.leavesService.getBalances(employeeId, year);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN, Role.MANAGER)
  approve(@Param('id') id: string, @CurrentUser('employeeId') approverId: string, @Body() dto: ApproveLeaveDto) {
    return this.leavesService.approve(id, approverId, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('employeeId') employeeId: string) {
    return this.leavesService.cancel(id, employeeId);
  }
}
