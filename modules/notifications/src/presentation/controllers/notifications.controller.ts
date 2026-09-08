import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { NOTIFICATIONS_CONTROLLER_PATHS } from '../../notifications.paths';
import { ListMyNotificationsUseCase } from '../../application/inbox/use-cases/list-my-notifications.use-case';
import { GetMyUnreadCountUseCase } from '../../application/inbox/use-cases/get-my-unread-count.use-case';
import { MarkNotificationReadUseCase } from '../../application/inbox/use-cases/mark-notification-read.use-case';
import { ArchiveNotificationUseCase } from '../../application/inbox/use-cases/archive-notification.use-case';
import { MarkAllNotificationsReadUseCase } from '../../application/inbox/use-cases/mark-all-notifications-read.use-case';
import { ListNotificationsQueryDto } from '../dto/inbox/list-notifications-query.dto';
import { NotificationResponse } from '../dto/inbox/notification.response';
import { NotificationListResponse } from '../dto/inbox/notification-list.response';
import { NotificationCountResponse } from '../dto/inbox/notification-count.response';

// Self-service only — JwtAuthGuard, no PermissionsGuard, same shape as
// NotificationPreferencesController: the caller only ever reads/mutates their own inbox, gated by
// per-use-case ownership checks (see application/inbox/use-cases), not by a permission.
@ApiTags('Notifications — Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(NOTIFICATIONS_CONTROLLER_PATHS.NOTIFICATIONS)
export class NotificationsController {
  constructor(
    private readonly listMyNotifications: ListMyNotificationsUseCase,
    private readonly getMyUnreadCount: GetMyUnreadCountUseCase,
    private readonly markNotificationRead: MarkNotificationReadUseCase,
    private readonly archiveNotification: ArchiveNotificationUseCase,
    private readonly markAllNotificationsRead: MarkAllNotificationsReadUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's in-app notifications" })
  @ApiResponse({ status: 200, type: NotificationListResponse })
  async list(@Query() query: ListNotificationsQueryDto): Promise<NotificationListResponse> {
    const result = await this.listMyNotifications.execute(this.context.getUserId(), query);
    return plainToInstance(
      NotificationListResponse,
      {
        total: result.total,
        items: plainToInstance(NotificationResponse, result.items, { excludeExtraneousValues: true }),
      },
      { excludeExtraneousValues: true },
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: "Count the caller's unread in-app notifications" })
  @ApiResponse({ status: 200, type: NotificationCountResponse })
  async unreadCount(): Promise<NotificationCountResponse> {
    const count = await this.getMyUnreadCount.execute(this.context.getUserId());
    return plainToInstance(NotificationCountResponse, { count }, { excludeExtraneousValues: true });
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark one of the caller\'s notifications as read' })
  @ApiResponse({ status: 204 })
  async markRead(@Param('id') id: string): Promise<void> {
    await this.markNotificationRead.execute(this.context.getUserId(), id);
  }

  @Patch(':id/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive one of the caller\'s notifications' })
  @ApiResponse({ status: 204 })
  async archive(@Param('id') id: string): Promise<void> {
    await this.archiveNotification.execute(this.context.getUserId(), id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the caller's notifications as read" })
  @ApiResponse({ status: 200, type: NotificationCountResponse })
  async markAllRead(): Promise<NotificationCountResponse> {
    const { count } = await this.markAllNotificationsRead.execute(this.context.getUserId());
    return plainToInstance(NotificationCountResponse, { count }, { excludeExtraneousValues: true });
  }
}
