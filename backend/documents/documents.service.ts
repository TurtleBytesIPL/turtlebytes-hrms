import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // ─── Upload document (base64 or URL) ─────────────────────────────────────

  async uploadDocument(employeeId: string, dto: any, uploadedBy: string) {
    const { type, name, fileBase64, mimeType, fileSize, fileUrl } = dto;

    // Validate type
    if (!type) throw new BadRequestException('Document type is required');
    if (!name) throw new BadRequestException('Document name is required');

    // Validate PDF only
    if (fileBase64 && mimeType && mimeType !== 'application/pdf') {
      throw new UnsupportedMediaTypeException('Only PDF files are allowed');
    }

    // Check if a VERIFIED doc of this type exists — employee cannot re-upload verified docs
    const verified = await this.prisma.employeeDocument.findFirst({
      where: { employeeId, type, status: 'VERIFIED' },
    });
    if (verified) {
      throw new ForbiddenException(
        'A verified document of this type already exists. Contact HR to update it.'
      );
    }

    // Save base64 file to disk if provided
    let savedFileUrl = fileUrl || '';
    let savedMimeType = mimeType || 'application/pdf';
    let savedFileSize = fileSize || 0;

    if (fileBase64) {
      // Strip data URL prefix if present
      const base64Data = fileBase64.includes(',')
        ? fileBase64.split(',')[1]
        : fileBase64;

      const filename = `${uuid()}.pdf`;
      const filepath = path.join(UPLOADS_DIR, filename);
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);

      savedFileUrl = `/api/v1/documents/file/${filename}`;
      savedFileSize = buffer.length;
      savedMimeType = 'application/pdf';
    }

    if (!savedFileUrl) throw new BadRequestException('No file provided');

    // Create new document record (old rejected ones stay as history)
    return this.prisma.employeeDocument.create({
      data: {
        employeeId,
        type,
        name,
        fileUrl: savedFileUrl,
        fileSize: savedFileSize,
        mimeType: savedMimeType,
        uploadedBy,
        status: 'PENDING',
      },
    });
  }

  // ─── Serve file ───────────────────────────────────────────────────────────

  getFilePath(filename: string): string {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filepath)) throw new NotFoundException('File not found');
    return filepath;
  }

  // ─── Get all documents (HR view) ─────────────────────────────────────────

  async getAllDocuments(params?: any) {
    const { employeeId, status, type } = params || {};
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    return this.prisma.employeeDocument.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, departmentId: true,
            department: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Get employee documents (grouped by type, showing full history) ───────

  async getEmployeeDocuments(employeeId: string) {
    const docs = await this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    // Group by type — latest first per type
    const byType: Record<string, any[]> = {};
    for (const doc of docs) {
      if (!byType[doc.type]) byType[doc.type] = [];
      byType[doc.type].push(doc);
    }

    return { docs, byType };
  }

  // ─── Verify / Reject ──────────────────────────────────────────────────────

  async verifyDocument(id: string, verifiedBy: string, status: 'VERIFIED' | 'REJECTED', remarks?: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status === 'VERIFIED') throw new ForbiddenException('Document already verified');

    return this.prisma.employeeDocument.update({
      where: { id },
      data: { status, verifiedBy, verifiedAt: new Date(), remarks: remarks || null },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // ─── Delete (only pending, never verified, keep rejected for history) ─────

  async deleteDocument(id: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status === 'VERIFIED') {
      throw new ForbiddenException('Verified documents cannot be deleted');
    }
    if (doc.status === 'REJECTED') {
      throw new ForbiddenException('Rejected documents are kept for record. Only HR can remove them.');
    }
    // Delete file from disk if stored locally
    if (doc.fileUrl?.startsWith('/api/v1/documents/file/')) {
      const filename = doc.fileUrl.split('/').pop();
      if (filename) {
        const filepath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }
    }
    await this.prisma.employeeDocument.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  // ─── HR force delete (can delete any status) ──────────────────────────────

  async hrDeleteDocument(id: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.fileUrl?.startsWith('/api/v1/documents/file/')) {
      const filename = doc.fileUrl.split('/').pop();
      if (filename) {
        const filepath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      }
    }
    await this.prisma.employeeDocument.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getDocumentStats() {
    const [total, pending, verified, rejected] = await Promise.all([
      this.prisma.employeeDocument.count(),
      this.prisma.employeeDocument.count({ where: { status: 'PENDING' } }),
      this.prisma.employeeDocument.count({ where: { status: 'VERIFIED' } }),
      this.prisma.employeeDocument.count({ where: { status: 'REJECTED' } }),
    ]);
    return { total, pending, verified, rejected };
  }
}
