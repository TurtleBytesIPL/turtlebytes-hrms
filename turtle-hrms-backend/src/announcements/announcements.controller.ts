import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AnnouncementsService, CreateAnnouncementDto, UpdateAnnouncementDto } from './announcements.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@CurrentUser('employeeId') employeeId: string, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(employeeId, dto);
  }

  @Get()
  findAll(@Query('all') all?: string) {
    return this.announcementsService.findAll(all !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.announcementsService.findOne(id); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  remove(@Param('id') id: string) { return this.announcementsService.remove(id); }
}
