import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto, UpdateReviewDto, ReviewFilterDto } from './performance.dto.js';
import { ReviewStatus, Role } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    return this.prisma.performanceReview.create({
      data: {
        ...dto,
        reviewerId,
        reviewDate: new Date(dto.reviewDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        reviewee: { select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(filter: ReviewFilterDto, user: any) {
    const { revieweeId, reviewerId, status, reviewPeriod, page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (user.role === Role.EMPLOYEE) {
      where.OR = [{ revieweeId: user.employeeId }, { reviewerId: user.employeeId }];
    } else {
      if (revieweeId) where.revieweeId = revieweeId;
      if (reviewerId) where.reviewerId = reviewerId;
    }

    if (status) where.status = status;
    if (reviewPeriod) where.reviewPeriod = { contains: reviewPeriod, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.performanceReview.findMany({
        where,
        include: {
          reviewee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } } },
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.performanceReview.count({ where }),
    ]);

    return { data, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
      include: {
        reviewee: { select: { firstName: true, lastName: true, employeeCode: true, jobTitle: true, department: { select: { name: true } } } },
        reviewer: { select: { firstName: true, lastName: true, jobTitle: true } },
      },
    });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async update(id: string, employeeId: string, role: Role, dto: UpdateReviewDto) {
    const review = await this.findOne(id);

    // Employee can only add their own comments and acknowledge
    if (role === Role.EMPLOYEE) {
      if (review.revieweeId !== employeeId) throw new ForbiddenException();
    }

    const data: any = { ...dto };
    if (dto.reviewDate) data.reviewDate = new Date(dto.reviewDate);
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.status === ReviewStatus.SUBMITTED) data.submittedAt = new Date();
    if (dto.status === ReviewStatus.ACKNOWLEDGED) data.acknowledgedAt = new Date();

    return this.prisma.performanceReview.update({
      where: { id },
      data,
      include: {
        reviewee: { select: { firstName: true, lastName: true } },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getTeamReviews(managerId: string, period?: string) {
    const where: any = { reviewerId: managerId };
    if (period) where.reviewPeriod = period;

    return this.prisma.performanceReview.findMany({
      where,
      include: {
        reviewee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, jobTitle: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
