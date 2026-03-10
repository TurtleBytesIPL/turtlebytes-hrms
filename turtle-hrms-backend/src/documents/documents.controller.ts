import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, Res, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PHOTOS_DIR = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const multerOptions = {
  storage: diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const isPhoto = IMAGE_MIMES.includes(file.mimetype);
      cb(null, isPhoto ? PHOTOS_DIR : UPLOADS_DIR);
    },
    filename: (_req: any, file: any, cb: any) => {
      const isPhoto = IMAGE_MIMES.includes(file.mimetype);
      const ext = isPhoto ? (file.mimetype === 'image/png' ? '.png' : '.jpg') : '.pdf';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf' || IMAGE_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF or image files (JPG, PNG) are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) { }

  // ─── Serve uploaded file (no auth needed for inline viewing) ─────────────
  @Get('file/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const safe = path.basename(filename);
    const filepath = this.svc.getFilePath(safe);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    fs.createReadStream(filepath).pipe(res);
  }

  // ─── Serve photo (images) ────────────────────────────────────────────────
  @Get('photo/:filename')
  servePhoto(@Param('filename') filename: string, @Res() res: Response) {
    const safe = path.basename(filename);
    const filepath = path.join(PHOTOS_DIR, safe);
    if (!fs.existsSync(filepath)) {
      (res as any).status(404).json({ message: 'Photo not found' });
      return;
    }
    const ext = path.extname(safe).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filepath).pipe(res);
  }

  // ─── Download file (with content-disposition: attachment) ─────────────────
  @Get('download/:filename')
  @UseGuards(JwtAuthGuard)
  downloadFile(
    @Param('filename') filename: string,
    @Query('name') name: string,
    @Res() res: Response,
  ) {
    const safe = path.basename(filename);
    const filepath = this.svc.getFilePath(safe);
    const downloadName = name ? `${name}.pdf` : safe;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    fs.createReadStream(filepath).pipe(res);
  }

  // ─── HR: get all docs ─────────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getAll(@Query() params: any) {
    return this.svc.getAllDocuments(params);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getStats() {
    return this.svc.getDocumentStats();
  }

  // ─── Department-wise document stats (for onboarding dashboard) ───────────
  @Get('dept-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  getDeptStats() {
    return this.svc.getDeptDocumentStats();
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  getEmployeeDocs(@Param('employeeId') employeeId: string) {
    return this.svc.getEmployeeDocuments(employeeId);
  }

  // ─── Upload via multipart/form-data ──────────────────────────────────────
  @Post('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  upload(
    @Param('employeeId') employeeId: string,
    @UploadedFile() file: any,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.svc.uploadDocument(employeeId, body, file, req.user.id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  verify(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.verifyDocument(id, req.user.id, body.status, body.remarks);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.svc.deleteDocument(id);
  }

  @Delete(':id/force')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  hrDelete(@Param('id') id: string) {
    return this.svc.hrDeleteDocument(id);
  }
}