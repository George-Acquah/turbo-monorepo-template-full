import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';
import { CreatePermissionUseCase } from '../../application/permissions/use-cases/create-permission.use-case';
import { UpdatePermissionUseCase } from '../../application/permissions/use-cases/update-permission.use-case';
import { ListPermissionsUseCase } from '../../application/permissions/use-cases/list-permissions.use-case';
import { PermissionsGuard } from '@workspace/permissions';
import { CreatePermissionDto } from '../dto/permissions/create-permission.dto';
import { UpdatePermissionDto } from '../dto/permissions/update-permission.dto';
import { ListPermissionsQueryDto } from '../dto/permissions/list-permissions-query.dto';
import { PermissionResponse } from '../dto/permissions/permission.response';

@ApiTags('Identity — Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.PERMISSIONS)
export class PermissionsController {
  constructor(
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
  ) {}

  @Post()
  @RequirePermission(Action.MANAGE, Resource.PERMISSION)
  @ApiOperation({ summary: 'Create a permission' })
  @ApiResponse({ status: 201, type: PermissionResponse })
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponse> {
    const created = await this.createPermissionUseCase.execute(dto);
    return plainToInstance(PermissionResponse, created, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermission(Action.LIST, Resource.PERMISSION)
  @ApiOperation({ summary: 'List permissions' })
  @ApiResponse({ status: 200, type: [PermissionResponse] })
  async list(@Query() query: ListPermissionsQueryDto): Promise<PermissionResponse[]> {
    const permissions = await this.listPermissionsUseCase.execute(query);
    return plainToInstance(PermissionResponse, permissions, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @RequirePermission(Action.MANAGE, Resource.PERMISSION)
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', description: 'Permission id', example: 'pmt_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: PermissionResponse })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponse> {
    const updated = await this.updatePermissionUseCase.execute(id, dto);
    return plainToInstance(PermissionResponse, updated, { excludeExtraneousValues: true });
  }
}
