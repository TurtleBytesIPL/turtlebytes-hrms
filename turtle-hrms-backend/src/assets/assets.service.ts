import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { AssetStatus, AssetType } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAssetDto {
  @IsString() name: string;
  @IsOptional() @IsEnum(AssetType) type?: AssetType;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsDateString() purchaseDate?: string;
  @IsOptional() @IsNumber() purchaseValue?: number;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
}

export class AssignAssetDto {
  @IsUUID() employeeId: string;
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    const count = await this.prisma.asset.count();
    const prefix = dto.type ? dto.type.substring(0, 3).toUpperCase() : 'AST';
    const assetCode = `TB-${prefix}-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.asset.create({
      data: { ...dto, assetCode, purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined },
    });
  }

  async findAll(filter: any) {
    const where: any = {};
    if (filter.category) where.category = { contains: filter.category, mode: 'insensitive' };
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.employeeId) where.assignedToId = filter.employeeId;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { assetCode: { contains: filter.search, mode: 'insensitive' } },
        { brand: { contains: filter.search, mode: 'insensitive' } },
        { serialNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.asset.findMany({
      where,
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id);
    return this.prisma.asset.update({ where: { id }, data: dto });
  }

  async assign(id: string, dto: AssignAssetDto) {
    const asset = await this.findOne(id);
    if (asset.status === AssetStatus.ASSIGNED) throw new ConflictException('Asset is already assigned');
    const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.asset.update({
      where: { id },
      data: { assignedToId: dto.employeeId, assignedAt: new Date(), status: AssetStatus.ASSIGNED },
      include: { assignedTo: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
  }

  async unassign(id: string) {
    const asset = await this.findOne(id);
    if (asset.status !== AssetStatus.ASSIGNED) throw new BadRequestException('Asset is not assigned');
    return this.prisma.asset.update({ where: { id }, data: { assignedToId: null, returnedAt: new Date(), status: AssetStatus.AVAILABLE } });
  }

  async remove(id: string) {
    const asset = await this.findOne(id);
    if (asset.status === AssetStatus.ASSIGNED) throw new ConflictException('Cannot delete assigned asset');
    await this.prisma.asset.delete({ where: { id } });
    return { message: 'Asset deleted' };
  }

  async exportToExcel() {
    const assets = await this.prisma.asset.findMany({
      include: { assignedTo: { select: { firstName: true, lastName: true, employeeCode: true } } },
      orderBy: { assetCode: 'asc' },
    });

    // Build CSV (no exceljs needed — works everywhere)
    const headers = ['Asset Code','Name','Type','Category','Brand','Model','Serial No','Status','Assigned To','Employee Code','Assigned Date','Return Date','Purchase Date','Purchase Value','Condition'];
    const rows = assets.map(a => [
      a.assetCode, a.name, a.type || '', a.category || '', a.brand || '', a.model || '',
      a.serialNumber || '', a.status,
      a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : '',
      a.assignedTo?.employeeCode || '',
      a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('en-IN') : '',
      a.returnedAt ? new Date(a.returnedAt).toLocaleDateString('en-IN') : '',
      a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('en-IN') : '',
      a.purchaseValue || '',
      a.condition || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    return [headers.join(','), ...rows].join('\n');
  }
}
