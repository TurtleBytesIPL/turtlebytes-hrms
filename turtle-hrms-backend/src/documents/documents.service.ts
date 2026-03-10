import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) { }

  // ─── Upload (multipart file from multer) ──────────────────────────────────
  async uploadDocument(employeeId: string, body: any, file: any, uploadedBy: string) {
    const { type, name } = body;
    if (!type) throw new BadRequestException('Document type is required');
    if (!name) throw new BadRequestException('Document name is required');
    if (!file) throw new BadRequestException('File is required');

    const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const isPhoto = type === 'PROFILE_PHOTO' || IMAGE_MIMES.includes(file.mimetype);

    // For PROFILE_PHOTO: update employee's profilePhoto and also create doc record
    if (isPhoto) {
      const photoUrl = `/api/v1/documents/photo/${file.filename}`;
      // Update employee's profilePhoto field
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { profilePhoto: photoUrl },
      });
      // Also save as a document record for HR to see
      return this.prisma.employeeDocument.create({
        data: {
          employeeId,
          type: 'PROFILE_PHOTO' as any,
          name: name || 'Profile Photo',
          fileUrl: photoUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy,
          status: 'PENDING',
        },
      });
    }

    // Block re-upload of verified docs (PDF only)
    const verified = await this.prisma.employeeDocument.findFirst({
      where: { employeeId, type, status: 'VERIFIED' },
    });
    if (verified) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ForbiddenException('A verified document of this type already exists.');
    }

    const fileUrl = `/api/v1/documents/file/${file.filename}`;

    return this.prisma.employeeDocument.create({
      data: {
        employeeId, type, name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
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

  // ─── HR: all docs ─────────────────────────────────────────────────────────
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
          select: {
            firstName: true, lastName: true, employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Employee docs grouped by type ───────────────────────────────────────
  async getEmployeeDocuments(employeeId: string) {
    const docs = await this.prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
    const byType: Record<string, any[]> = {};
    for (const doc of docs) {
      if (!byType[doc.type]) byType[doc.type] = [];
      byType[doc.type].push(doc);
    }
    return { docs, byType };
  }

  // ─── Dept-wise document stats (onboarding dashboard) ─────────────────────
  async getDeptDocumentStats() {
    const departments = await this.prisma.department.findMany({
      include: {
        employees: {
          include: {
            documents: { select: { status: true } },
          },
          where: { status: 'ACTIVE' },
        },
      },
    });

    return departments.map(dept => {
      let total = 0, pending = 0, verified = 0, rejected = 0, reuploaded = 0;
      for (const emp of dept.employees) {
        for (const doc of emp.documents) {
          total++;
          if (doc.status === 'PENDING') pending++;
          else if (doc.status === 'VERIFIED') verified++;
          else if (doc.status === 'REJECTED') rejected++;
        }
      }
      return {
        department: dept.name,
        employeeCount: dept.employees.length,
        total, pending, verified, rejected,
        completionRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      };
    });
  }

  // ─── Verify / Reject ──────────────────────────────────────────────────────
  async verifyDocument(id: string, verifiedBy: string, status: 'VERIFIED' | 'REJECTED', remarks?: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status === 'VERIFIED') throw new ForbiddenException('Document already verified');
    return this.prisma.employeeDocument.update({
      where: { id },
      data: { status, verifiedBy, verifiedAt: new Date(), remarks: remarks || null },
    });
  }

  // ─── Employee delete (pending only) ──────────────────────────────────────
  async deleteDocument(id: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status === 'VERIFIED') throw new ForbiddenException('Verified documents cannot be deleted');
    if (doc.status === 'REJECTED') throw new ForbiddenException('Rejected docs are kept for record. Contact HR.');
    this.deleteFile(doc.fileUrl);
    await this.prisma.employeeDocument.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  // ─── HR delete (any status) ───────────────────────────────────────────────
  async hrDeleteDocument(id: string) {
    const doc = await this.prisma.employeeDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    this.deleteFile(doc.fileUrl);
    await this.prisma.employeeDocument.delete({ where: { id } });
    return { message: 'Document deleted' };
  }

  private deleteFile(fileUrl: string) {
    if (fileUrl?.startsWith('/api/v1/documents/file/')) {
      const filename = fileUrl.split('/').pop();
      if (filename) {
        const fp = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    }
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