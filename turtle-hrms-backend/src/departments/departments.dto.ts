import { IsString, IsOptional, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  headId?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
