import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';
import { CreateApiClientUseCase } from '../../application/api-clients/use-cases/create-api-client.use-case';
import { UpdateApiClientUseCase } from '../../application/api-clients/use-cases/update-api-client.use-case';
import { ListApiClientsUseCase } from '../../application/api-clients/use-cases/list-api-clients.use-case';
import { GetApiClientUseCase } from '../../application/api-clients/use-cases/get-api-client.use-case';
import { RevokeApiClientUseCase } from '../../application/api-clients/use-cases/revoke-api-client.use-case';
import { PermissionsGuard } from '@workspace/permissions';
import { CreateApiClientDto } from '../dto/api-clients/create-api-client.dto';
import { UpdateApiClientDto } from '../dto/api-clients/update-api-client.dto';
import { ApiClientResponse } from '../dto/api-clients/api-client.response';
import { ApiClientCreatedResponse } from '../dto/api-clients/api-client-created.response';

@ApiTags('Identity — API Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.API_CLIENTS)
export class ApiClientsController {
  constructor(
    private readonly createApiClientUseCase: CreateApiClientUseCase,
    private readonly updateApiClientUseCase: UpdateApiClientUseCase,
    private readonly listApiClientsUseCase: ListApiClientsUseCase,
    private readonly getApiClientUseCase: GetApiClientUseCase,
    private readonly revokeApiClientUseCase: RevokeApiClientUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Post()
  @RequirePermission(Action.MANAGE, Resource.OPS)
  @ApiOperation({ summary: 'Create a machine API client. The returned secret is shown only once.' })
  @ApiResponse({ status: 201, type: ApiClientCreatedResponse })
  async create(@Body() dto: CreateApiClientDto): Promise<ApiClientCreatedResponse> {
    const created = await this.createApiClientUseCase.execute({
      ...dto,
      createdByUserId: this.context.getUserId(),
    });
    return plainToInstance(ApiClientCreatedResponse, created, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermission(Action.LIST, Resource.OPS)
  @ApiOperation({ summary: 'List API clients' })
  @ApiResponse({ status: 200, type: [ApiClientResponse] })
  async list(): Promise<ApiClientResponse[]> {
    const clients = await this.listApiClientsUseCase.execute();
    return plainToInstance(ApiClientResponse, clients, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @RequirePermission(Action.READ, Resource.OPS)
  @ApiOperation({ summary: 'Get an API client' })
  @ApiParam({ name: 'id', description: 'API client id', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: ApiClientResponse })
  async get(@Param('id') id: string): Promise<ApiClientResponse> {
    const client = await this.getApiClientUseCase.execute(id);
    return plainToInstance(ApiClientResponse, client, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @RequirePermission(Action.MANAGE, Resource.OPS)
  @ApiOperation({ summary: 'Update an API client' })
  @ApiParam({ name: 'id', description: 'API client id', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: ApiClientResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateApiClientDto): Promise<ApiClientResponse> {
    const updated = await this.updateApiClientUseCase.execute(id, dto);
    return plainToInstance(ApiClientResponse, updated, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @RequirePermission(Action.MANAGE, Resource.OPS)
  @ApiOperation({ summary: 'Revoke an API client (blocks future authentication; history is kept)' })
  @ApiParam({ name: 'id', description: 'API client id', example: 'acl_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 204 })
  async revoke(@Param('id') id: string): Promise<void> {
    await this.revokeApiClientUseCase.execute(id);
  }
}
