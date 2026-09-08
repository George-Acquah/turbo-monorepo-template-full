import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@workspace/guards';
import { CONTEXT_TOKEN, type ContextPort } from '@workspace/ports';
import { PROFILES_CONTROLLER_PATHS } from '../../profiles.paths';
import { RecordConsentUseCase } from '../../application/consent/use-cases/record-consent.use-case';
import { WithdrawConsentUseCase } from '../../application/consent/use-cases/withdraw-consent.use-case';
import { GetMyConsentsUseCase } from '../../application/consent/use-cases/get-my-consents.use-case';
import { RecordConsentDto } from '../dto/consents/record-consent.dto';
import { ConsentResponse } from '../dto/consents/consent.response';

// Self-service only — same reasoning as AccountController: no PermissionsGuard.
@ApiTags('Profiles — Consents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller(PROFILES_CONTROLLER_PATHS.CONSENTS)
export class ConsentsController {
  constructor(
    private readonly recordConsentUseCase: RecordConsentUseCase,
    private readonly withdrawConsentUseCase: WithdrawConsentUseCase,
    private readonly getMyConsentsUseCase: GetMyConsentsUseCase,
    @Inject(CONTEXT_TOKEN) private readonly context: ContextPort,
  ) {}

  @Get()
  @ApiOperation({ summary: "List the caller's consent decisions" })
  @ApiResponse({ status: 200, type: [ConsentResponse] })
  async list(): Promise<ConsentResponse[]> {
    const consents = await this.getMyConsentsUseCase.execute(this.context.getUserId());
    return plainToInstance(ConsentResponse, consents, { excludeExtraneousValues: true });
  }

  @Post()
  @ApiOperation({ summary: 'Grant a consent' })
  @ApiResponse({ status: 201, type: ConsentResponse })
  async grant(@Body() dto: RecordConsentDto): Promise<ConsentResponse> {
    const record = await this.recordConsentUseCase.execute(this.context.getUserId(), {
      kind: dto.kind,
      version: dto.version,
      ipAddress: this.context.getIp(),
    });
    return plainToInstance(ConsentResponse, record, { excludeExtraneousValues: true });
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw a previously granted consent' })
  @ApiResponse({ status: 201, type: ConsentResponse })
  async withdraw(@Body() dto: RecordConsentDto): Promise<ConsentResponse> {
    const record = await this.withdrawConsentUseCase.execute(this.context.getUserId(), {
      kind: dto.kind,
      version: dto.version,
      ipAddress: this.context.getIp(),
    });
    return plainToInstance(ConsentResponse, record, { excludeExtraneousValues: true });
  }
}
