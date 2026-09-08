import { Body, Controller, Delete, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { RequirePermission } from '@workspace/decorators';
import { Action, Resource } from '@workspace/constants';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { IDENTITY_CONTROLLER_PATHS } from '../../identity.paths';
import { AssignRoleToUserUseCase } from '../../application/user-roles/use-cases/assign-role-to-user.use-case';
import { RevokeRoleFromUserUseCase } from '../../application/user-roles/use-cases/revoke-role-from-user.use-case';
import { GetUserActiveRolesUseCase } from '../../application/user-roles/use-cases/get-user-active-roles.use-case';
import { PermissionsGuard } from '@workspace/permissions';
import { AssignRoleToUserDto } from '../dto/user-roles/assign-role-to-user.dto';
import { UserRoleResponse } from '../dto/user-roles/user-role.response';

@ApiTags('Identity — User Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(IDENTITY_CONTROLLER_PATHS.USER_ROLES)
export class UserRolesController {
  constructor(
    private readonly assignRoleToUserUseCase: AssignRoleToUserUseCase,
    private readonly revokeRoleFromUserUseCase: RevokeRoleFromUserUseCase,
    private readonly getUserActiveRolesUseCase: GetUserActiveRolesUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Post()
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 201, type: UserRoleResponse })
  async assign(@Body() dto: AssignRoleToUserDto): Promise<UserRoleResponse> {
    const assignment = await this.assignRoleToUserUseCase.execute({
      ...dto,
      grantedBy: this.context.getUserId(),
    });
    return plainToInstance(UserRoleResponse, assignment, { excludeExtraneousValues: true });
  }

  @Get(':userId')
  @RequirePermission(Action.READ, Resource.ROLE)
  @ApiOperation({ summary: "List a user's active role assignments" })
  @ApiParam({ name: 'userId', description: 'User id', example: 'usr_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 200, type: [UserRoleResponse] })
  async listActive(@Param('userId') userId: string): Promise<UserRoleResponse[]> {
    const assignments = await this.getUserActiveRolesUseCase.execute(userId);
    return plainToInstance(UserRoleResponse, assignments, { excludeExtraneousValues: true });
  }

  @Delete(':userId/:roleId')
  @RequirePermission(Action.MANAGE, Resource.ROLE)
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiParam({ name: 'userId', description: 'User id', example: 'usr_2f8x9k3m1a0b7c6d5e4f' })
  @ApiParam({ name: 'roleId', description: 'Role id', example: 'rol_2f8x9k3m1a0b7c6d5e4f' })
  @ApiResponse({ status: 204 })
  async revoke(@Param('userId') userId: string, @Param('roleId') roleId: string): Promise<void> {
    await this.revokeRoleFromUserUseCase.execute({ userId, roleId });
  }
}
