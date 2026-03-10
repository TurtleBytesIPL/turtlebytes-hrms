import { IsString, IsEnum, IsDateString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { PerformanceRating, ReviewStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateReviewDto {
  @IsUUID()
  revieweeId: string;

  @IsString()
  reviewPeriod: string;

  @IsDateString()
  reviewDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  goals?: any[];

  @IsOptional()
  @IsArray()
  skills?: any[];

  @IsEnum(PerformanceRating)
  overallRating: PerformanceRating;

  @IsOptional()
  @IsString()
  achievements?: string;

  @IsOptional()
  @IsString()
  areasToImprove?: string;

  @IsOptional()
  @IsString()
  trainingNeeds?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @IsOptional()
  @IsString()
  employeeComments?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}

export class ReviewFilterDto {
  @IsOptional()
  @IsUUID()
  revieweeId?: string;

  @IsOptional()
  @IsUUID()
  reviewerId?: string;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsString()
  reviewPeriod?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
