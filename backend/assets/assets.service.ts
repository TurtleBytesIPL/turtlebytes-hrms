import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID } from 'class-validator';
import { AssetStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsNumber()
  purchaseValue?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}

export class AssignAssetDto {
  @IsUUID()
  employeeId: string;
}

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    const count = await this.prisma.asset.count();
    const assetCode = `AST${String(count + 1).padStart(3, '0')}`;

    return this.prisma.asset.create({
      data: { ...dto, assetCode, purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined },
    });
  }

  async findAll(filter: any) {
    const where: any = {};
    if (filter.category) where.category = { contains: filter.category, mode: 'insensitive' };
    if (filter.status) where.status = filter.status;
    if (filter.employeeId) where.assignedToId = filter.employeeId;

    return this.prisma.asset.findMany({
      where,
      include: { assignedTo: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
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

    return this.prisma.asset.update({
      where: { id },
      data: { assignedToId: null, returnedAt: new Date(), status: AssetStatus.AVAILABLE },
    });
  }

  async remove(id: string) {
    const asset = await this.findOne(id);
    if (asset.status === AssetStatus.ASSIGNED) throw new ConflictException('Cannot delete assigned asset');
    await this.prisma.asset.delete({ where: { id } });
    return { message: 'Asset deleted' };
  }
}
