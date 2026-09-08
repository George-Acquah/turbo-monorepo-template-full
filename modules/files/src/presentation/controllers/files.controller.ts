import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { ProfileResolverService } from '@workspace/profile-context';
import {
  CONTEXT_TOKEN,
  type ContextPort,
  FILE_RECORD_REPOSITORY_TOKEN,
  type FileRecordRepositoryPort,
  STORAGE_PORT_TOKEN,
  type StoragePort,
} from '@workspace/ports';
import { FileErrorCodes, FileVisibility } from '@workspace/constants';
import { ForbiddenAppException, NotFoundAppException } from '@workspace/utils';
import { FILES_CONTROLLER_PATHS } from '../../files.paths';
import { CreateUploadIntentUseCase } from '../../application/uploads/use-cases/create-upload-intent.use-case';
import { CompleteUploadUseCase } from '../../application/uploads/use-cases/complete-upload.use-case';
import { CreateUploadIntentDto } from '../dto/create-upload-intent.dto';
import { UploadIntentResponse, CompleteUploadResponse, FileUrlResponse } from '../dto/upload-intent.response';

/**
 * `POST /v1/files/uploads` → `POST /v1/files/uploads/:uploadId/complete` →
 * `GET /v1/files/:fileId/url` (doc 09 §1). `GET .../url`'s "grant-checked"
 * is deliberately narrow here (owner match or PUBLIC visibility) — the
 * richer "does this profile have access to the *lesson* this file belongs
 * to" check is the calling module's job via `FilesApplicationPort`, not this
 * generic route.
 */
@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(FILES_CONTROLLER_PATHS.FILES)
export class FilesController {
  constructor(
    private readonly createUploadIntentUseCase: CreateUploadIntentUseCase,
    private readonly completeUploadUseCase: CompleteUploadUseCase,
    private readonly profileResolver: ProfileResolverService,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
    @Inject(FILE_RECORD_REPOSITORY_TOKEN) private readonly fileRecordRepo: FileRecordRepositoryPort,
    @Inject(STORAGE_PORT_TOKEN) private readonly storage: StoragePort,
  ) {}

  @Post('uploads')
  @ApiOperation({ summary: 'Create a presigned upload intent' })
  @ApiResponse({ status: 201, type: UploadIntentResponse })
  async createUploadIntent(@Body() dto: CreateUploadIntentDto): Promise<UploadIntentResponse> {
    const userId = this.context.getUserId();
    const profileId = await this.profileResolver.resolveProfileId(userId);

    const result = await this.createUploadIntentUseCase.execute({
      purpose: dto.purpose,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      profileId,
      userId: profileId ? undefined : userId,
    });
    return plainToInstance(UploadIntentResponse, result, { excludeExtraneousValues: true });
  }

  @Post('uploads/:uploadId/complete')
  @ApiOperation({ summary: 'Finalise a completed upload into a FileRecord' })
  @ApiParam({ name: 'uploadId', example: 'flu_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: CompleteUploadResponse })
  async completeUpload(@Param('uploadId') uploadId: string): Promise<CompleteUploadResponse> {
    const userId = this.context.getUserId();
    const profileId = await this.profileResolver.resolveProfileId(userId);

    const result = await this.completeUploadUseCase.execute({
      uploadId,
      profileId,
      userId: profileId ? undefined : userId,
    });
    return plainToInstance(CompleteUploadResponse, result, { excludeExtraneousValues: true });
  }

  @Get(':fileId/url')
  @ApiOperation({ summary: 'Resolve a short-lived signed GET URL for a private file' })
  @ApiParam({ name: 'fileId', example: 'fil_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: FileUrlResponse })
  async getFileUrl(@Param('fileId') fileId: string): Promise<FileUrlResponse> {
    const file = await this.fileRecordRepo.findById(fileId);
    if (!file || file.deletedAt) {
      throw new NotFoundAppException(FileErrorCodes.FILE_NOT_FOUND, `File "${fileId}" not found`);
    }

    if (file.visibility !== FileVisibility.PUBLIC) {
      const userId = this.context.getUserId();
      const profileId = await this.profileResolver.resolveProfileId(userId);
      const isOwner = file.ownerProfileId === profileId || file.uploadedByUserId === userId;
      if (!isOwner) {
        throw new ForbiddenAppException(FileErrorCodes.FILE_ACCESS_DENIED, 'Not authorized for this file');
      }
    }

    const signed = await this.storage.getDownloadUrl({ bucket: file.bucket, key: file.objectKey });
    return plainToInstance(FileUrlResponse, signed, { excludeExtraneousValues: true });
  }
}
