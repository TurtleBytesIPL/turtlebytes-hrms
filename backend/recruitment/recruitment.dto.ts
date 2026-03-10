import { IsString, IsEmail, IsOptional, IsEnum, IsNumber, IsDateString, IsUUID, IsBoolean } from 'class-validator'
import { CandidateStatus, InterviewMode } from '@prisma/client'
import { PartialType } from '@nestjs/mapped-types'

export class CreateJobOpeningDto {
  @IsString()
  title: string

  @IsUUID()
  departmentId: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsString()
  requirements?: string

  @IsOptional() @IsString()
  location?: string

  @IsOptional() @IsNumber()
  minSalary?: number

  @IsOptional() @IsNumber()
  maxSalary?: number

  @IsOptional() @IsNumber()
  openings?: number

  @IsOptional() @IsDateString()
  closingDate?: string
}

export class UpdateJobOpeningDto extends PartialType(CreateJobOpeningDto) {
  @IsOptional() @IsBoolean()
  isActive?: boolean
}

export class CreateCandidateDto {
  @IsString()
  name: string

  @IsOptional() @IsEmail()
  email?: string

  @IsString()
  phone: string

  @IsString()
  role: string

  @IsOptional() @IsUUID()
  jobOpeningId?: string

  @IsOptional() @IsString()
  source?: string

  @IsOptional() @IsString()
  referredBy?: string

  @IsOptional() @IsString()
  currentCompany?: string

  @IsOptional() @IsString()
  currentRole?: string

  @IsOptional() @IsNumber()
  experience?: number

  @IsOptional() @IsNumber()
  expectedSalary?: number

  @IsOptional() @IsNumber()
  noticePeriod?: number

  @IsOptional() @IsString()
  location?: string

  @IsOptional() @IsString()
  skills?: string

  @IsOptional() @IsString()
  notes?: string

  @IsOptional() @IsString()
  assignedToId?: string
}

export class UpdateCandidateDto extends PartialType(CreateCandidateDto) {
  @IsOptional() @IsEnum(CandidateStatus)
  status?: CandidateStatus
}

export class AddCallLogDto {
  @IsString()
  status: string

  @IsOptional() @IsString()
  notes?: string

  @IsOptional() @IsDateString()
  nextCallDate?: string
}

export class ScheduleInterviewDto {
  @IsDateString()
  scheduledAt: string

  @IsOptional() @IsEnum(InterviewMode)
  mode?: InterviewMode

  @IsOptional() @IsNumber()
  round?: number

  @IsOptional() @IsString()
  interviewerId?: string

  @IsOptional() @IsString()
  location?: string

  @IsOptional() @IsString()
  meetingLink?: string
}

export class UpdateInterviewDto {
  @IsOptional() @IsString()
  feedback?: string

  @IsOptional() @IsNumber()
  rating?: number

  @IsOptional() @IsString()
  result?: string

  @IsOptional() @IsDateString()
  conductedAt?: string
}

export class CreateOfferDto {
  @IsNumber()
  offeredSalary: number

  @IsOptional() @IsDateString()
  joiningDate?: string
}

export class CandidateFilterDto {
  @IsOptional() @IsString()
  search?: string

  @IsOptional() @IsEnum(CandidateStatus)
  status?: CandidateStatus

  @IsOptional() @IsString()
  role?: string

  @IsOptional() @IsUUID()
  jobOpeningId?: string

  @IsOptional()
  page?: number

  @IsOptional()
  limit?: number
}
