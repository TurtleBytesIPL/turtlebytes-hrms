import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AssetsService, CreateAssetDto, UpdateAssetDto, AssignAssetDto } from './assets.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@Body() dto: CreateAssetDto) { return this.assetsService.create(dto); }

  @Get()
  findAll(@Query() filter: any) { return this.assetsService.findAll(filter); }

  @Get('my-assets')
  getMyAssets(@CurrentUser('employeeId') employeeId: string) {
    return this.assetsService.findAll({ employeeId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.assetsService.findOne(id); }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) { return this.assetsService.update(id, dto); }

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  assign(@Param('id') id: string, @Body() dto: AssignAssetDto) { return this.assetsService.assign(id, dto); }

  @Patch(':id/unassign')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  unassign(@Param('id') id: string) { return this.assetsService.unassign(id); }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  remove(@Param('id') id: string) { return this.assetsService.remove(id); }
}
