import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';
import { CreateApiKeyUseCase } from '../../application/api-keys/use-cases/create-api-key.use-case';
import { RevokeApiKeyUseCase } from '../../application/api-keys/use-cases/revoke-api-key.use-case';
import { ListClientKeysUseCase } from '../../application/api-keys/use-cases/list-client-keys.use-case';
import { PermissionsGuard } from '@workspace/permissions';
import { CreateApiKeyDto } from '../dto/api-keys/create-api-key.dto';
import { ListApiKeysQueryDto } from '../dto/api-keys/list-api-keys-query.dto';
import { ApiKeyResponse } from '../dto/api-keys/api-key.response';
import { ApiKeyCreatedResponse } from '../dto/api-keys/api-key-created.response';

@ApiTags('Identity — API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.API_KEYS)
export class ApiKeysController {
  constructor(
    private readonly createApiKeyUseCase: CreateApiKeyUseCase,
    private readonly revokeApiKeyUseCase: RevokeApiKeyUseCase,
    private readonly listClientKeysUseCase: ListClientKeysUseCase,
  ) {}

  @Post()
  @RequirePermission(Action.MANAGE, Resource.OPS)
  @ApiOperation({ summary: 'Mint a new API key for a client. The returned key is shown only once.' })
  @ApiResponse({ status: 201, type: ApiKeyCreatedResponse })
  async create(@Body() dto: CreateApiKeyDto): Promise<ApiKeyCreatedResponse> {
    const created = await this.createApiKeyUseCase.execute(dto);
    return plainToInstance(ApiKeyCreatedResponse, created, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermission(Action.LIST, Resource.OPS)
  @ApiOperation({ summary: "List a client's API keys" })
  @ApiQuery({ name: 'apiClientId', description: 'API client id', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: [ApiKeyResponse] })
  async list(@Query() query: ListApiKeysQueryDto): Promise<ApiKeyResponse[]> {
    const keys = await this.listClientKeysUseCase.execute(query.apiClientId);
    return plainToInstance(ApiKeyResponse, keys, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @RequirePermission(Action.MANAGE, Resource.OPS)
  @ApiOperation({ summary: 'Revoke an API key immediately' })
  @ApiParam({ name: 'id', description: 'API key id', example: 'aky_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 204 })
  async revoke(@Param('id') id: string): Promise<void> {
    await this.revokeApiKeyUseCase.execute(id);
  }
}
