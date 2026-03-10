import { IsNumber, IsUUID, IsOptional, IsEnum, IsString, Min } from 'class-validator';
import { PayrollStatus } from '@prisma/client';

export class GeneratePayrollDto {
  @IsUUID()
  employeeId: string;

  @IsNumber()
  @Min(1)
  month: number;

  @IsNumber()
  year: number;

  @IsNumber()
  ctc: number;

  @IsOptional()
  @IsUUID()
  salaryStructureId?: string;

  @IsOptional()
  @IsNumber()
  bonus?: number;

  @IsOptional()
  @IsNumber()
  incentives?: number;

  @IsOptional()
  @IsNumber()
  otherDeductions?: number;

  @IsOptional()
  @IsNumber()
  otherAllowances?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkPayrollDto {
  @IsNumber()
  @Min(1)
  month: number;

  @IsNumber()
  year: number;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class UpdatePayrollStatusDto {
  @IsEnum(PayrollStatus)
  status: PayrollStatus;
}

export class PayrollFilterDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
