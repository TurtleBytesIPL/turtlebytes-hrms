import { IsString, IsEmail, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Gender, EmploymentType, EmployeeStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEmployeeDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsDateString()
  dateOfBirth?: string;

  @IsOptional() @IsEnum(Gender)
  gender?: Gender;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  permanentAddress?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  state?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  pincode?: string;

  @IsString()
  jobTitle: string;

  @IsOptional() @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsDateString()
  joiningDate: string;

  @IsOptional() @IsDateString()
  probationEndDate?: string;

  @IsUUID()
  departmentId: string;

  @IsOptional() @IsUUID()
  managerId?: string;

  @IsOptional() @IsString()
  bankName?: string;

  @IsOptional() @IsString()
  accountNumber?: string;

  @IsOptional() @IsString()
  ifscCode?: string;

  @IsOptional() @IsString()
  panNumber?: string;

  @IsOptional() @IsString()
  aadhaarNumber?: string;

  @IsOptional() @IsString()
  pfNumber?: string;

  @IsOptional() @IsString()
  bloodGroup?: string;

  @IsOptional() @IsString()
  maritalStatus?: string;

  @IsOptional() @IsString()
  emergencyContact?: string;

  @IsOptional() @IsString()
  emergencyPhone?: string;

  @IsOptional() @IsString()
  password?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsOptional() @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}

export class EmployeeFilterDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsUUID()
  departmentId?: string;

  @IsOptional() @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional() @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
