import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HolidaysService, CreateHolidayDto, UpdateHolidayDto } from './holidays.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('holidays')
@UseGuards(JwtAuthGuard)
export class HolidaysController {
  constructor(private holidaysService: HolidaysService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@Body() dto: CreateHolidayDto) { return this.holidaysService.create(dto); }

  @Get()
  findAll(@Query('year') year?: number) { return this.holidaysService.findAll(year); }

  @Get('upcoming')
  getUpcoming(@Query('limit') limit?: number) { return this.holidaysService.getUpcoming(limit); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.holidaysService.findOne(id); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) { return this.holidaysService.update(id, dto); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  remove(@Param('id') id: string) { return this.holidaysService.remove(id); }
}
