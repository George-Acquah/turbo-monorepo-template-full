import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Built via `plainToInstance(UploadIntentResponse, result, { excludeExtraneousValues: true })`.
 */
export class UploadIntentResponse {
  @ApiProperty({ example: 'flu_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  uploadId!: string;

  @ApiProperty()
  @Expose()
  presignedUrl!: string;

  @ApiProperty()
  @Expose()
  expiresAt!: Date;
}

export class CompleteUploadResponse {
  @ApiProperty({ example: 'fil_2f8x9k3m1a0b7c6d5e4f' })
  @Expose()
  fileId!: string;
}

export class FileUrlResponse {
  @ApiProperty()
  @Expose()
  url!: string;

  @ApiPropertyOptional()
  @Expose()
  expiresAt?: Date;
}
