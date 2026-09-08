import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsPositive, IsString } from 'class-validator';
import { FilePurpose } from '@workspace/constants';

export class CreateUploadIntentDto {
  @ApiProperty({ enum: Object.values(FilePurpose), example: FilePurpose.RESOURCE })
  @IsEnum(FilePurpose)
  purpose!: FilePurpose;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 1_048_576 })
  @IsInt()
  @IsPositive()
  sizeBytes!: number;
}
