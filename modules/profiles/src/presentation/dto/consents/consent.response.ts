import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ConsentKind } from '@workspace/constants';

/**
 * Built via `plainToInstance(ConsentResponse, record, { excludeExtraneousValues: true })`.
 */
export class ConsentResponse {
  @ApiProperty({ description: 'Consent record id.', example: 'cns_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Which consent this decision is for.', enum: Object.values(ConsentKind) })
  @Expose()
  kind!: ConsentKind;

  @ApiProperty({ description: 'Document version this decision applied to.' })
  @Expose()
  version!: string;

  @ApiProperty({ description: 'True if granted, false if withdrawn.' })
  @Expose()
  granted!: boolean;

  @ApiPropertyOptional({ type: String, description: 'Requestor IP at the time of the decision.', nullable: true })
  @Expose()
  ipAddress!: string | null;

  @ApiProperty({ description: 'When this decision was recorded.' })
  @Expose()
  createdAt!: Date;
}
