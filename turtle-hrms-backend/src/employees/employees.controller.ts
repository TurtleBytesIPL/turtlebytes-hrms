import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeFilterDto } from './employees.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) { }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Post('bulk-import')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  bulkImport(@Body() body: { rows: any[]; departmentId: string }) {
    return this.employeesService.bulkImportFromExcel(body.rows, body.departmentId);
  }

  @Get()
  findAll(@Query() filter: EmployeeFilterDto) {
    return this.employeesService.findAll(filter);
  }

  @Get('directory')
  getDirectory() {
    return this.employeesService.getDirectory();
  }

  @Get('org-chart')
  getOrgChart() {
    return this.employeesService.getOrgChart();
  }

  @Get('birthdays/today')
  getTodayBirthdays() {
    return this.employeesService.getTodayBirthdays();
  }

  @Get('department/:departmentId')
  getByDepartment(@Param('departmentId') departmentId: string) {
    return this.employeesService.getByDepartment(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  // ─── Serve Profile Photo ─────────────────────────────────────────────────
  @Get('photo/:filename')
  servePhoto(@Param('filename') filename: string, @Res() res: any) {
    try {
      const filepath = this.employeesService.getPhotoPath(filename);
      const ext = path.extname(filename).toLowerCase();
      res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      fs.createReadStream(filepath).pipe(res);
    } catch {
      res.status(404).json({ message: 'Photo not found' });
    }
  }

  // ─── Profile Photo Upload ─────────────────────────────────────────────────
  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), 'uploads', 'photos');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
        cb(null, `${randomUUID()}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPG or PNG images allowed'), false);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: any) {
    return this.employeesService.updateProfilePhoto(id, file);
  }

  // ─── Delete Profile Photo ─────────────────────────────────────────────────
  @Delete(':id/photo')
  async deletePhoto(@Param('id') id: string) {
    return this.employeesService.deleteProfilePhoto(id);
  }
}