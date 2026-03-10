import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, Res, StreamableFile,
} from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '@prisma/client';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('documents')
export class DocumentsController {
  constructor(private svc: DocumentsService) {}

  // ─── Public: serve uploaded file ─────────────────────────────────────────
  @Get('file/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    // Sanitize filename to prevent directory traversal
    const safe = path.basename(filename);
    const filepath = this.svc.getFilePath(safe);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safe}"`);
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  }

  // ─── Protected routes ─────────────────────────────────────────────────────
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

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  getEmployeeDocs(@Param('employeeId') employeeId: string) {
    return this.svc.getEmployeeDocuments(employeeId);
  }

  @Post('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  upload(
    @Param('employeeId') employeeId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.svc.uploadDocument(employeeId, dto, req.user.id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  verify(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.svc.verifyDocument(id, req.user.id, body.status, body.remarks);
  }

  // Employee can only delete PENDING docs
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.svc.deleteDocument(id);
  }

  // HR can delete any doc
  @Delete(':id/force')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  hrDelete(@Param('id') id: string) {
    return this.svc.hrDeleteDocument(id);
  }
}
