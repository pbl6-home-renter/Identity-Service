import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { spawn, ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Global, Module, INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder, SchemaObject } from '@nestjs/swagger';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { exportJWK, exportSPKI, generateKeyPair, SignJWT } from 'jose';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AuditModule } from 'modules/audit/audit.module';
import { AuditLogTypeormEntity } from 'modules/audit/infrastructure/persistence/audit-log.typeorm-entity';
import { AuditLogQueryService } from 'modules/audit/infrastructure/services/audit-log-query.service';
import { AUDIT_LOG_QUERY_SERVICE_DI_TOKEN } from 'modules/audit/audit.di-token';
import { AuditLogListResponseDto } from 'modules/audit/presentation/http/responses/audit-log-list.response.dto';
import { AuditLogDetailResponseDto } from 'modules/audit/presentation/http/responses/audit-log-detail.response.dto';
import { AuditLogDetail } from 'modules/audit/application/queries/models/audit-log-detail.model';
import { AUDIT_LOG_ACTIONS } from 'modules/audit/application/queries/models/audit-log-action';
import { AUDIT_LOG_ENTITY_TYPES } from 'modules/audit/application/queries/models/audit-log-entity-type';
import { UserEntity } from 'modules/users/infrastructure/persistence/user.typeorm-entity';
import { LandlordProfileEntity } from 'modules/landlord-profiles/infrastructure/persistence/landlord-profile.typeorm-entity';
import { RefreshTokenEntity } from 'modules/auth/infrastructure/persistence/refresh-token.typeorm-entity';
import { UNIT_OF_WORK_DI_TOKEN } from 'shared/application/di-tokens';
import { ApiConfigService } from 'shared/infrastructure/config/api-config.service';
import { SnakeNamingStrategy } from 'shared/infrastructure/database/snake-naming.strategy';
import { SecurityModule } from 'shared/security.module';
import { LoggingExceptionFilter } from 'shared/presentation/http/filters/error-handling-exception.filter';
import { ResponseTransformInterceptor } from 'shared/presentation/http/interceptors/response-transform.interceptor';
import { AppValidationPipe } from 'shared/presentation/http/pipes/app-validation.pipe';
import { CreateAuditLogsTable1795426800901 } from '../../src/database/migrations/1795426800901-CreateAuditLogsTable';
import { UpgradeAuditLogsForUserActions1795440754831 } from '../../src/database/migrations/1795440754831-UpgradeAuditLogsForUserActions';

// Intentionally opt-in. Never load .env or connect to a service's normal database.
const databaseUrl = process.env.AUDIT_TEST_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'AUDIT_TEST_DATABASE_URL must point at a disposable p11_06_audit_test database',
  );
const parsedUrl = new URL(databaseUrl);
assert.ok(['127.0.0.1', 'localhost'].includes(parsedUrl.hostname));
assert.equal(parsedUrl.pathname, '/p11_06_audit_test');
assert.equal(parsedUrl.username, 'audit_test');

@Global()
@Module({})
class TestDependencies {}

const id = (n: number): Uuid =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as Uuid;
const actorId = id(101);
const deletedActorId = id(102);
const missingActorId = id(103);
const removedActorId = id(104);
const entityId = id(201);
const listKeys = [
  'id',
  'actorId',
  'actorName',
  'action',
  'entityType',
  'entityId',
  'sourceService',
  'createdAt',
].sort();
const rows = Array.from({ length: 30 }, (_, index) => ({
  id: id(index + 1),
  actorId: [actorId, deletedActorId, missingActorId, null, removedActorId][
    index % 5
  ],
  action: [
    'user.locked',
    'user.unlocked',
    'user.updated',
    'user.deleted',
    'building.approved',
    'building.rejected',
  ][index % 6],
  entityType: index % 6 >= 4 ? 'building' : 'user',
  entityId: index % 5 === 0 ? null : entityId,
  sourceService: index % 6 >= 4 ? 'tenancy' : 'identity',
  metadata:
    index % 6 === 0
      ? { lockReason: 'Spam' }
      : index % 6 === 2
        ? { changedFields: ['name'] }
        : index % 6 >= 4
          ? { note: 'Reviewed' }
          : {},
  // Every pair shares a timestamp; UUID descending must break ties.
  createdAt: new Date(Date.UTC(2026, 10, 24, 3, 0, Math.floor(index / 2))),
  occurredAt: new Date('2026-01-01T00:00:00Z'),
  sourceEventId: `private-event-${index}`,
}));
const sortedRows = [...rows].sort(
  (a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id),
);
let app: INestApplication;
let source: DataSource;
let service: AuditLogQueryService;
let baseUrl: string;
let gateway: ChildProcess | undefined;
let gatewayUrl: string | undefined;
let adminToken: string;
const tokens: Record<string, string> = {};
const evidence: unknown[] = [];

async function request(
  path: string,
  token: string | undefined = adminToken,
  base = baseUrl,
  headers: Record<string, string> = {},
) {
  const response = await fetch(`${base}/api/v1/audit-logs${path}`, {
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const body = await response.json();
  evidence.push({
    through: base === gatewayUrl ? 'gateway' : 'identity-test-app',
    request: {
      method: 'GET',
      path: `/api/v1/audit-logs${path}`,
      auth:
        token === adminToken ? 'admin' : token ? 'other-or-invalid' : 'none',
    },
    status: response.status,
    response: body,
  });
  return { status: response.status, body };
}

before(async () => {
  source = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [
      AuditLogTypeormEntity,
      UserEntity,
      LandlordProfileEntity,
      RefreshTokenEntity,
    ],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
  });
  await source.initialize();
  // Refuse even the dedicated database if it is not empty. No destructive setup.
  const existing = await source.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
  );
  assert.equal(existing.length, 0, 'Use a fresh disposable database');
  const runner = source.createQueryRunner();
  await new CreateAuditLogsTable1795426800901().up(runner);
  await new UpgradeAuditLogsForUserActions1795440754831().up(runner);
  // Only actor columns used by the adapter; sensitive columns detect accidental selection.
  await runner.query(
    'CREATE TABLE users (id uuid PRIMARY KEY, name text NOT NULL, is_deleted boolean NOT NULL, password text, email text, phone text)',
  );
  await runner.query(
    'INSERT INTO users VALUES ($1,$2,false,$3,$4,$5), ($6,$7,true,$3,$4,$5)',
    [
      actorId,
      'Active Admin',
      'SECRET_PASSWORD',
      'private@example.com',
      '0900000000',
      deletedActorId,
      'Deleted Admin',
    ],
  );
  await runner.query(
    'INSERT INTO users (id, name, is_deleted) VALUES ($1, $2, false)',
    [removedActorId, 'Removed Admin'],
  );
  await runner.query('DELETE FROM users WHERE id = $1', [removedActorId]);
  await runner.release();
  await source
    .getRepository(AuditLogTypeormEntity)
    .save(rows as AuditLogTypeormEntity[]);

  const keys = await generateKeyPair('RS256', { extractable: true });
  const publicKey = await exportSPKI(keys.publicKey);
  for (const role of ['admin', 'landlord', 'tenant']) {
    tokens[role] = await new SignJWT({ role, status: 'active' })
      .setProtectedHeader({ alg: 'RS256', kid: 'audit-test' })
      .setSubject(actorId)
      .setIssuer('audit-test')
      .setAudience('audit-api')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(keys.privateKey);
  }
  adminToken = tokens.admin;
  tokens.locked = await new SignJWT({ role: 'admin', status: 'locked' })
    .setProtectedHeader({ alg: 'RS256', kid: 'audit-test' })
    .setSubject(actorId)
    .setIssuer('audit-test')
    .setAudience('audit-api')
    .setExpirationTime('5m')
    .sign(keys.privateKey);
  tokens.expired = await new SignJWT({ role: 'admin', status: 'active' })
    .setProtectedHeader({ alg: 'RS256', kid: 'audit-test' })
    .setSubject(actorId)
    .setIssuer('audit-test')
    .setAudience('audit-api')
    .setExpirationTime(1)
    .sign(keys.privateKey);
  const config = {
    auth: {
      publicKey,
      issuer: 'audit-test',
      audience: 'audit-api',
      serviceToken: 'unused-test-service-token',
    },
  };
  const testing = await Test.createTestingModule({
    imports: [
      {
        module: TestDependencies,
        global: true,
        providers: [
          { provide: DataSource, useValue: source },
          { provide: ApiConfigService, useValue: config },
          {
            provide: UNIT_OF_WORK_DI_TOKEN,
            useValue: {
              execute: () => {
                throw new Error('Read API must not write');
              },
            },
          },
        ],
        exports: [DataSource, ApiConfigService, UNIT_OF_WORK_DI_TOKEN],
      },
      CqrsModule.forRoot(),
      AuditModule,
      SecurityModule,
    ],
    providers: [
      { provide: APP_FILTER, useClass: LoggingExceptionFilter },
      { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    ],
  }).compile();
  app = testing.createNestApplication({ logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new AppValidationPipe());
  const jwk = {
    ...(await exportJWK(keys.publicKey)),
    kid: 'audit-test',
    alg: 'RS256',
    use: 'sig',
  };
  app
    .getHttpAdapter()
    .get(
      '/api/v1/.well-known/jwks.json',
      (_req: unknown, res: { json: (data: unknown) => void }) =>
        res.json({ statusCode: 200, code: 'SUCCESS', data: { keys: [jwk] } }),
    );
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
  service = app.get(AUDIT_LOG_QUERY_SERVICE_DI_TOKEN);

  // Optional: use the actual gateway executable without editing its source.
  if (process.env.AUDIT_TEST_GATEWAY_ENTRY) {
    const probe = createServer();
    await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
    const address = probe.address();
    assert.ok(address && typeof address !== 'string');
    const port = address.port;
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    gatewayUrl = `http://127.0.0.1:${port}`;
    gateway = spawn(process.execPath, [process.env.AUDIT_TEST_GATEWAY_ENTRY], {
      env: {
        ...process.env,
        PORT: String(port),
        IDENTITY_SERVICE_URL: baseUrl,
        JWKS_URL: `${baseUrl}/api/v1/.well-known/jwks.json`,
        JWT_ISSUER: 'audit-test',
        JWT_AUDIENCE: 'audit-api',
        RATE_LIMIT_MAX: '10000',
      },
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let errors = '';
    gateway.stderr?.on('data', (data) => {
      errors += String(data);
    });
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        ready = (await fetch(`${gatewayUrl}/health`)).ok;
      } catch {
        /* starting */
      }
      if (ready || gateway.exitCode !== null) break;
      await delay(100);
    }
    assert.ok(ready, `Gateway failed to start: ${errors}`);
  }
});

after(async () => {
  if (process.env.AUDIT_TEST_EVIDENCE_PATH)
    writeFileSync(
      process.env.AUDIT_TEST_EVIDENCE_PATH,
      JSON.stringify(
        {
          database: 'disposable PostgreSQL / p11_06_audit_test',
          realGuards: true,
          realJwtVerification: true,
          gateway: Boolean(gatewayUrl),
          requests: evidence,
        },
        null,
        2,
      ) + '\n',
    );
  if (gateway && gateway.exitCode === null) {
    const exited = new Promise<void>((resolve) =>
      gateway!.once('exit', () => resolve()),
    );
    gateway.kill('SIGTERM');
    await exited;
  }
  await app?.close();
  if (source?.isInitialized) await source.destroy();
});

test('PostgreSQL pagination: page 2 of 30, stable descending ties, exact count', async () => {
  const result = await service.findAuditLogsAdmin({ pageNo: 2, pageSize: 10 });
  assert.deepEqual(
    result.data.map((row) => row.id),
    sortedRows.slice(10, 20).map((row) => row.id),
  );
  assert.deepEqual(result.pagination, {
    type: 'offset',
    pageNo: 2,
    pageSize: 10,
    totalItems: 30,
    totalPages: 3,
    hasNextPage: true,
    hasPreviousPage: true,
  });
  assert.deepEqual(Object.keys(result.data[0]).sort(), listKeys);
});

test('PostgreSQL: every filter, inclusive bounds and AND combinations', async () => {
  const filters = [
    { action: 'user.locked' as const },
    { entityType: 'building' as const, entityId },
    { actorId },
    { from: rows[8].createdAt, to: rows[15].createdAt },
    { from: rows[8].createdAt, to: rows[8].createdAt },
    {
      action: 'user.locked' as const,
      entityType: 'user' as const,
      entityId,
      actorId: deletedActorId,
      from: rows[4].createdAt,
      to: rows[26].createdAt,
    },
  ];
  for (const filter of filters) {
    const expected = sortedRows.filter((row) =>
      Object.entries(filter).every(([key, value]) =>
        key === 'from'
          ? row.createdAt >= value
          : key === 'to'
            ? row.createdAt <= value
            : row[key as keyof typeof row] === value,
      ),
    );
    assert.ok(
      expected.length > 0,
      'Each positive filter case must match the fixture',
    );
    const result = await service.findAuditLogsAdmin({
      pageNo: 1,
      pageSize: 100,
      ...filter,
    });
    assert.deepEqual(
      result.data.map((row) => row.id),
      expected.map((row) => row.id),
    );
    assert.equal(result.pagination.totalItems, expected.length);
  }
});

test('PostgreSQL: missing/deleted/null actors preserve audit and actorId', async () => {
  for (const row of rows.slice(0, 5)) {
    const detail = await service.findById(row.id);
    assert.ok(detail);
    assert.equal(detail.actorId, row.actorId);
    assert.equal(
      detail.actorName,
      row.actorId === actorId ? 'Active Admin' : null,
    );
    assert.deepEqual(detail.metadata, row.metadata);
    assert.deepEqual(
      Object.keys(detail).sort(),
      [...listKeys, 'metadata'].sort(),
    );
  }
  const list = await service.findAuditLogsAdmin({ pageNo: 1, pageSize: 100 });
  assert.equal(list.data.length, 30);
  for (const row of list.data)
    assert.equal(
      row.actorName,
      row.actorId === actorId ? 'Active Admin' : null,
    );
  assert.equal(await service.findById(id(999)), null);
});

test('PostgreSQL: empty results and out-of-range pages retain correct pagination', async () => {
  const empty = await service.findAuditLogsAdmin({
    pageNo: 1,
    pageSize: 20,
    entityId: id(999),
  });
  assert.deepEqual(empty, {
    data: [],
    pagination: {
      type: 'offset',
      pageNo: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const beyond = await service.findAuditLogsAdmin({ pageNo: 4, pageSize: 10 });
  assert.deepEqual(beyond.data, []);
  assert.deepEqual(beyond.pagination, {
    type: 'offset',
    pageNo: 4,
    pageSize: 10,
    totalItems: 30,
    totalPages: 3,
    hasNextPage: false,
    hasPreviousPage: true,
  });
});

test('Swagger preserves the list envelope, supported queries and UUID schemas', () => {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().build(),
  );
  const operation = document.paths['/api/v1/audit-logs'].get!;
  const response = operation.responses['200'];
  assert.ok(response);
  assert.ok('content' in response);
  const schema = response.content!['application/json'].schema as SchemaObject;
  assert.deepEqual(schema.required, [
    'statusCode',
    'code',
    'data',
    'pagination',
  ]);
  assert.equal((schema.properties!.data as SchemaObject).type, 'array');
  const item = document.components!.schemas!
    .AuditLogListResponseDto as SchemaObject;
  assert.deepEqual((item.properties!.action as SchemaObject).enum, [
    ...AUDIT_LOG_ACTIONS,
  ]);
  assert.deepEqual((item.properties!.entityType as SchemaObject).enum, [
    ...AUDIT_LOG_ENTITY_TYPES,
  ]);
  for (const name of ['AuditLogListResponseDto', 'AuditLogDetailResponseDto']) {
    const responseDto = document.components!.schemas![name] as SchemaObject;
    for (const field of ['id', 'actorId', 'entityId']) {
      const property = responseDto.properties![field] as SchemaObject;
      assert.equal(property.type, 'string');
      assert.equal(property.format, 'uuid');
      if (field !== 'id') assert.equal(property.nullable, true);
    }
  }
  for (const field of ['actorId', 'entityId']) {
    const parameter = operation.parameters!.find(
      (param) => 'name' in param && param.name === field,
    );
    assert.ok(parameter && 'schema' in parameter);
    assert.equal((parameter.schema as SchemaObject).type, 'string');
    assert.equal((parameter.schema as SchemaObject).format, 'uuid');
  }
  const detail = document.paths['/api/v1/audit-logs/{auditLogId}'].get!;
  const pathId = detail.parameters!.find(
    (param) => 'name' in param && param.name === 'auditLogId',
  );
  assert.ok(pathId && 'schema' in pathId);
  assert.equal((pathId.schema as SchemaObject).type, 'string');
  assert.equal((pathId.schema as SchemaObject).format, 'uuid');
  assert.deepEqual(
    operation
      .parameters!.map((param) => ('name' in param ? param.name : ''))
      .sort(),
    [
      'action',
      'entityType',
      'actorId',
      'entityId',
      'from',
      'to',
      'pageNo',
      'pageSize',
    ].sort(),
  );
});

test('DTO mapping discards any columns beyond contract', () => {
  const item = {
    ...rows[0],
    actorName: 'Admin',
    password: 'private',
    beforeData: {},
    afterData: {},
  } as AuditLogDetail;
  assert.deepEqual(
    Object.keys(AuditLogListResponseDto.fromResult(item)).sort(),
    listKeys,
  );
  assert.deepEqual(
    Object.keys(AuditLogDetailResponseDto.fromResult(item)).sort(),
    [...listKeys, 'metadata'].sort(),
  );
});

test('HTTP: real validation pipe and CQRS, standard envelopes and not-found/path errors', async () => {
  const list = await request('?pageSize=10&pageNo=2');
  assert.equal(list.status, 200);
  assert.deepEqual(
    Object.keys(list.body).sort(),
    ['statusCode', 'code', 'data', 'pagination'].sort(),
  );
  assert.equal(list.body.code, 'AUDIT_LOGS_FETCHED');
  assert.equal(list.body.pagination.totalItems, 30);
  assert.equal(list.body.pagination.totalPages, 3);
  assert.deepEqual(
    list.body.data.map((row: { id: Uuid }) => row.id),
    sortedRows.slice(10, 20).map((row) => row.id),
  );
  assert.deepEqual(Object.keys(list.body.data[0]).sort(), listKeys);
  const defaults = await request('');
  assert.equal(defaults.body.data.length, 20);
  assert.equal(defaults.body.pagination.pageNo, 1);
  assert.equal(defaults.body.pagination.pageSize, 20);
  const detail = await request(`/${id(1)}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.code, 'AUDIT_LOG_FETCHED');
  assert.deepEqual(detail.body.data.metadata, { lockReason: 'Spam' });
  assert.equal(detail.body.data.entityId, null);
  assert.deepEqual(
    Object.keys(detail.body.data).sort(),
    [...listKeys, 'metadata'].sort(),
  );
  assert.deepEqual(await request(`/${id(999)}`), {
    status: 404,
    body: { statusCode: 404, code: 'AUDIT_LOG_NOT_FOUND' },
  });
  assert.deepEqual(await request('/bad-id'), {
    status: 400,
    body: { statusCode: 400, code: 'BAD_REQUEST' },
  });
  const raw = JSON.stringify([list.body, detail.body]);
  for (const forbidden of [
    'sourceEventId',
    'source_event_id',
    'occurredAt',
    'beforeData',
    'afterData',
    'password',
    'email',
    'phone',
  ])
    assert.ok(!raw.includes(forbidden));
});

test('HTTP: invalid filters, dates and pagination produce 422 VALIDATION_FAILED', async () => {
  const invalid: Record<string, string>[] = [
    { from: '2026-11-24T04:00:00Z', to: '2026-11-24T10:00:00+07:00' },
    { from: 'invalid' },
    { to: '2026-11-24' },
    { from: '2026-02-30T03:00:00Z' },
    { from: '2026-11-24T03:00:00' },
    { action: 'user.lock' },
    { entityType: 'payment' },
    { actorId: 'bad' },
    { entityId: 'bad' },
    { pageSize: '101' },
    { pageNo: '0' },
    { pageNo: '-1' },
    { pageSize: '0' },
    { pageSize: '1.5' },
    { pageNo: '1.5' },
    { pageSize: 'abc' },
    { pageNo: '' },
    { action: '' },
    { from: '' },
  ];
  for (const query of invalid) {
    assert.deepEqual(await request(`?${new URLSearchParams(query)}`), {
      status: 422,
      body: { statusCode: 422, code: 'VALIDATION_FAILED' },
    });
  }
  for (const field of ['filter', 'format', 'sort', 'order', 'role']) {
    assert.deepEqual(await request(`?${field}=bad`), {
      status: 422,
      body: { statusCode: 422, code: 'UNEXPECTED_FIELD' },
    });
  }
  assert.equal((await request('?actorId=bad&actorId=bad')).status, 422);
});

test('HTTP and gateway: all eight parameters match a retained audit with a deleted actor', async () => {
  const query = new URLSearchParams({
    action: 'user.locked',
    entityType: 'user',
    entityId,
    actorId: deletedActorId,
    from: rows[4].createdAt.toISOString(),
    to: rows[26].createdAt.toISOString(),
    pageNo: '1',
    pageSize: '10',
  });
  for (const base of [baseUrl, ...(gatewayUrl ? [gatewayUrl] : [])]) {
    const result = await request(`?${query}`, adminToken, base);
    assert.equal(result.status, 200);
    assert.equal(result.body.pagination.totalItems, 1);
    assert.deepEqual(
      result.body.data.map((row: { id: Uuid }) => row.id),
      [id(7)],
    );
    assert.equal(result.body.data[0].actorId, deletedActorId);
    assert.equal(result.body.data[0].actorName, null);
  }
});

test('HTTP and gateway: empty and out-of-range pages keep the standard envelope', async () => {
  for (const base of [baseUrl, ...(gatewayUrl ? [gatewayUrl] : [])]) {
    for (const [query, totalItems, totalPages, pageNo] of [
      [`?entityId=${id(999)}`, 0, 0, 1],
      ['?pageNo=4&pageSize=10', 30, 3, 4],
      ['?pageNo=1000000000000000000000000000000&pageSize=10', 30, 3, 1e30],
    ] as const) {
      const result = await request(query, adminToken, base);
      assert.deepEqual(result, {
        status: 200,
        body: {
          statusCode: 200,
          code: 'AUDIT_LOGS_FETCHED',
          data: [],
          pagination: {
            type: 'offset',
            pageNo,
            pageSize: pageNo === 1 ? 20 : 10,
            totalItems,
            totalPages,
            hasNextPage: false,
            hasPreviousPage: pageNo > 1,
          },
        },
      });
    }
  }
});

test('HTTP: equal/offset-equivalent instants and inclusive ranges are accepted', async () => {
  const result = await request(
    `?${new URLSearchParams({ from: '2026-11-24T10:00:00+07:00', to: '2026-11-24T03:00:00Z' })}`,
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.pagination.totalItems, 2);
  assert.deepEqual(
    result.body.data.map((row: { id: Uuid }) => row.id),
    [id(2), id(1)],
  );
});

test('HTTP: actual global guards and RS256 verification enforce both routes', async () => {
  for (const path of ['', `/${id(1)}`]) {
    for (const token of ['', 'invalid', tokens.expired]) {
      assert.deepEqual(
        await request(path, token, baseUrl, {
          'x-user-role': 'admin',
          'x-user-id': actorId,
        }),
        { status: 401, body: { statusCode: 401, code: 'UNAUTHORIZED' } },
      );
    }
    for (const role of ['landlord', 'tenant']) {
      assert.deepEqual(
        await request(path, tokens[role], baseUrl, { 'x-user-role': 'admin' }),
        { status: 403, body: { statusCode: 403, code: 'FORBIDDEN' } },
      );
    }
    assert.deepEqual(await request(path, tokens.locked), {
      status: 403,
      body: { statusCode: 403, code: 'ACCOUNT_LOCKED' },
    });
    assert.equal((await request(path)).status, 200);
  }
});

test(
  'Gateway: actual proxy, JWKS/JWT verification, both endpoints and role enforcement',
  { skip: !process.env.AUDIT_TEST_GATEWAY_ENTRY },
  async () => {
    assert.ok(gatewayUrl);
    for (const path of ['?pageNo=2&pageSize=10', `/${id(1)}`]) {
      const direct = await request(path);
      const proxied = await request(path, adminToken, gatewayUrl);
      assert.deepEqual(proxied, direct);
      for (const token of ['', 'invalid', tokens.expired])
        assert.equal((await request(path, token, gatewayUrl)).status, 401);
      for (const role of ['landlord', 'tenant'])
        assert.deepEqual(await request(path, tokens[role], gatewayUrl), {
          status: 403,
          body: { statusCode: 403, code: 'FORBIDDEN' },
        });
    }
    assert.deepEqual(await request(`/${id(999)}`, adminToken, gatewayUrl), {
      status: 404,
      body: { statusCode: 404, code: 'AUDIT_LOG_NOT_FOUND' },
    });
    assert.deepEqual(await request('?pageSize=101', adminToken, gatewayUrl), {
      status: 422,
      body: { statusCode: 422, code: 'VALIDATION_FAILED' },
    });
  },
);

test('Read endpoints leave append-only audit records unchanged', async () => {
  assert.equal(await source.getRepository(AuditLogTypeormEntity).count(), 30);
});
