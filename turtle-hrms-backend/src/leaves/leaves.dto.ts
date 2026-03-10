import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean, IsUUID, IsNumber } from 'class-validator';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLeaveDto {
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @IsString()
  reason: string;
}

export class ApproveLeaveDto {
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class LeaveFilterDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsEnum(LeaveType)
  leaveType?: LeaveType;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
