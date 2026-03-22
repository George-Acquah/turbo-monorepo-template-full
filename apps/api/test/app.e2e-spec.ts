import { Body, ConflictException, Controller, Delete, ForbiddenException, Get, HttpCode, Module, NotFoundException, Post, UnauthorizedException } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { IsNotEmpty, IsString } from 'class-validator';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { configureHttpApp } from '../src/app.setup';
import { AppContextModule } from '@repo/context';
import { SkipHttpResponseEnvelope } from '@repo/decorators';
import { HttpExceptionEnvelopeFilter } from '@repo/filters';
import { HttpResponseEnvelopeInterceptor } from '@repo/interceptor';
import { LOGGER_TOKEN } from '@repo/ports';

class CreateThingDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

class ProbeEntity {
  constructor(
    public readonly id: bigint,
    public readonly createdAt: Date,
  ) {}
}

@Controller('probe')
class ProbeController {
  @Get('success')
  getSuccess() {
    return {
      record: new ProbeEntity(42n, new Date('2026-01-01T00:00:00.000Z')),
      ids: [1n, 2n],
    };
  }

  @Post('created')
  create(@Body() dto: CreateThingDto) {
    return {
      id: 'thing-1',
      name: dto.name,
    };
  }

  @Delete('no-content')
  @HttpCode(204)
  remove(): void {}

  @Post('validate')
  validate(@Body() dto: CreateThingDto) {
    return dto;
  }

  @Get('not-found')
  notFound() {
    throw new NotFoundException({
      message: 'Record was not found',
      error: 'Not Found',
      errorCode: 'RECORD_NOT_FOUND',
    });
  }

  @Get('forbidden')
  forbidden() {
    throw new ForbiddenException({
      message: 'You cannot see this record',
      error: 'Forbidden',
      errorCode: 'ACCESS_DENIED',
    });
  }

  @Get('unauthorized')
  unauthorized() {
    throw new UnauthorizedException({
      message: 'Authentication required',
      error: 'Unauthorized',
      errorCode: 'AUTH_REQUIRED',
    });
  }

  @Get('conflict')
  conflict() {
    throw new ConflictException({
      message: 'Record already exists',
      error: 'Conflict',
      errorCode: 'RECORD_EXISTS',
    });
  }

  @Get('internal')
  internal() {
    throw new Error('unexpected boom');
  }

  @Get('raw')
  @SkipHttpResponseEnvelope()
  raw() {
    return 'raw payload';
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      cache: true,
    }),
    AppContextModule,
  ],
  controllers: [AppController, ProbeController],
  providers: [
    AppService,
    {
      provide: LOGGER_TOKEN,
      useValue: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      },
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionEnvelopeFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpResponseEnvelopeInterceptor,
    },
  ],
})
class TestHttpAppModule {}

describe('HTTP transport boundary (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestHttpAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureHttpApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps controller success responses centrally', async () => {
    const response = await request(app.getHttpServer())
      .get('/api')
      .set('x-request-id', 'root-corr-1')
      .set('x-device-id', 'device-root')
      .set('User-Agent', 'transport-e2e')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      statusCode: 200,
      data: 'Hello World!',
      message: null,
      meta: {
        method: 'GET',
        path: '/api',
        ip: expect.any(String),
        userAgent: 'transport-e2e',
        deviceId: 'device-root',
      },
      correlationId: 'root-corr-1',
      timestamp: expect.any(String),
    });
  });

  it('keeps POST creation semantics and serializes BigInt and Date centrally', async () => {
    const successResponse = await request(app.getHttpServer())
      .get('/api/probe/success')
      .set('x-correlation-id', 'success-corr-1')
      .set('x-device-id', 'device-success')
      .set('User-Agent', 'transport-e2e')
      .expect(200);

    expect(successResponse.body).toEqual({
      success: true,
      statusCode: 200,
      data: {
        record: {
          id: '42',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        ids: ['1', '2'],
      },
      message: null,
      meta: {
        method: 'GET',
        path: '/api/probe/success',
        ip: expect.any(String),
        userAgent: 'transport-e2e',
        deviceId: 'device-success',
      },
      correlationId: 'success-corr-1',
      timestamp: expect.any(String),
    });

    const createdResponse = await request(app.getHttpServer())
      .post('/api/probe/created')
      .send({ name: 'Thing One' })
      .expect(201);

    expect(createdResponse.body).toEqual({
      success: true,
      statusCode: 201,
      data: {
        id: 'thing-1',
        name: 'Thing One',
      },
      message: null,
      meta: {
        method: 'POST',
        path: '/api/probe/created',
        ip: expect.any(String),
      },
      correlationId: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('does not send a body for 204 endpoints', async () => {
    const response = await request(app.getHttpServer())
      .delete('/api/probe/no-content')
      .expect(204);

    expect(response.text).toBe('');
  });

  it('normalizes validation failures through the HTTP exception filter', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/probe/validate')
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      statusCode: 400,
      data: null,
      message: expect.stringContaining('name'),
      error: 'Bad Request',
      errorCode: null,
      errors: expect.arrayContaining([
        expect.stringContaining('name must be a string'),
        expect.stringContaining('name should not be empty'),
      ]),
      meta: {
        method: 'POST',
        path: '/api/probe/validate',
        ip: expect.any(String),
      },
      correlationId: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('normalizes not-found, forbidden, unauthorized, conflict, and internal errors', async () => {
    const notFoundResponse = await request(app.getHttpServer())
      .get('/api/probe/not-found')
      .set('x-request-id', 'not-found-corr-1')
      .expect(404);

    expect(notFoundResponse.body).toEqual({
      success: false,
      statusCode: 404,
      data: null,
      message: 'Record was not found',
      error: 'Not Found',
      errorCode: 'RECORD_NOT_FOUND',
      meta: {
        method: 'GET',
        path: '/api/probe/not-found',
        ip: expect.any(String),
      },
      correlationId: 'not-found-corr-1',
      timestamp: expect.any(String),
    });

    const forbiddenResponse = await request(app.getHttpServer())
      .get('/api/probe/forbidden')
      .set('x-request-id', 'forbidden-corr-1')
      .expect(403);

    expect(forbiddenResponse.body).toEqual({
      success: false,
      statusCode: 403,
      data: null,
      message: 'You cannot see this record',
      error: 'Forbidden',
      errorCode: 'ACCESS_DENIED',
      meta: {
        method: 'GET',
        path: '/api/probe/forbidden',
        ip: expect.any(String),
      },
      correlationId: 'forbidden-corr-1',
      timestamp: expect.any(String),
    });

    const unauthorizedResponse = await request(app.getHttpServer())
      .get('/api/probe/unauthorized')
      .expect(401);

    expect(unauthorizedResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 401,
        message: 'Authentication required',
        error: 'Unauthorized',
        errorCode: 'AUTH_REQUIRED',
      }),
    );

    const conflictResponse = await request(app.getHttpServer())
      .get('/api/probe/conflict')
      .expect(409);

    expect(conflictResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 409,
        message: 'Record already exists',
        error: 'Conflict',
        errorCode: 'RECORD_EXISTS',
      }),
    );

    const internalResponse = await request(app.getHttpServer())
      .get('/api/probe/internal')
      .expect(500);

    expect(internalResponse.body).toEqual(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });

  it('supports explicit HTTP opt-out for raw endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/probe/raw')
      .expect(200);

    expect(response.text).toBe('raw payload');
  });
});
