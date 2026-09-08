import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ConsentKind } from '@workspace/constants';

export class RecordConsentDto {
  @ApiProperty({ description: 'Which consent this decision is for.', enum: Object.values(ConsentKind) })
  @IsEnum(ConsentKind)
  kind!: ConsentKind;

  @ApiProperty({ description: 'Document version accepted/withdrawn.', example: 'tos-2026-06' })
  @IsString()
  @MaxLength(40)
  version!: string;
}
