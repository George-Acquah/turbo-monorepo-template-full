import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';
import { CreateRoleUseCase } from '../../application/roles/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/roles/use-cases/update-role.use-case';
import { ListRolesUseCase } from '../../application/roles/use-cases/list-roles.use-case';
import { GetRoleUseCase } from '../../application/roles/use-cases/get-role.use-case';
import { DeleteRoleUseCase } from '../../application/roles/use-cases/delete-role.use-case';
import { AssignPermissionToRoleUseCase } from '../../application/roles/use-cases/assign-permission-to-role.use-case';
import { RevokePermissionFromRoleUseCase } from '../../application/roles/use-cases/revoke-permission-from-role.use-case';
import { GetRolePermissionsUseCase } from '../../application/roles/use-cases/get-role-permissions.use-case';
import { PermissionsGuard } from '@workspace/permissions';
import { CreateRoleDto } from '../dto/roles/create-role.dto';
import { UpdateRoleDto } from '../dto/roles/update-role.dto';
import { ListRolesQueryDto } from '../dto/roles/list-roles-query.dto';
import { AssignPermissionToRoleDto } from '../dto/roles/assign-permission-to-role.dto';
import { RoleResponse } from '../dto/roles/role.response';

@ApiTags('Identity — Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.ROLES)
export class RolesController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly getRoleUseCase: GetRoleUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
    private readonly assignPermissionToRoleUseCase: AssignPermissionToRoleUseCase,
    private readonly revokePermissionFromRoleUseCase: RevokePermissionFromRoleUseCase,
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Post()
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Create a role' })
  @ApiResponse({ status: 201, type: RoleResponse })
  async create(@Body() dto: CreateRoleDto): Promise<RoleResponse> {
    const created = await this.createRoleUseCase.execute({
      ...dto,
      createdByUserId: this.context.getUserId(),
    });
    return plainToInstance(RoleResponse, created, { excludeExtraneousValues: true });
  }

  @Get()
  @RequirePermission(Action.LIST, Resource.ROLE)
  @ApiOperation({ summary: 'List roles' })
  @ApiResponse({ status: 200, type: [RoleResponse] })
  async list(@Query() query: ListRolesQueryDto): Promise<RoleResponse[]> {
    const roles = await this.listRolesUseCase.execute(query);
    return plainToInstance(RoleResponse, roles, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @RequirePermission(Action.READ, Resource.ROLE)
  @ApiOperation({ summary: 'Get a role' })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: RoleResponse })
  async get(@Param('id') id: string): Promise<RoleResponse> {
    const role = await this.getRoleUseCase.execute(id);
    return plainToInstance(RoleResponse, role, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: RoleResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<RoleResponse> {
    const updated = await this.updateRoleUseCase.execute(id, dto);
    return plainToInstance(RoleResponse, updated, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Soft-delete a role' })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteRoleUseCase.execute(id);
  }

  @Get(':id/permissions')
  @RequirePermission(Action.READ, Resource.ROLE)
  @ApiOperation({ summary: "List a role's granted permission keys" })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: [String] })
  async getPermissions(@Param('id') id: string): Promise<string[]> {
    return this.getRolePermissionsUseCase.execute(id);
  }

  @Post(':id/permissions')
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Grant a permission to a role' })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 201 })
  async assignPermission(
    @Param('id') id: string,
    @Body() dto: AssignPermissionToRoleDto,
  ): Promise<void> {
    await this.assignPermissionToRoleUseCase.execute({
      roleId: id,
      permissionId: dto.permissionId,
      grantedByUserId: this.context.getUserId(),
    });
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  @ApiParam({ name: 'id', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiParam({ name: 'permissionId', description: 'Permission id', example: 'pmt_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 204 })
  async revokePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ): Promise<void> {
    await this.revokePermissionFromRoleUseCase.execute({ roleId: id, permissionId });
  }
}
