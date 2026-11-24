# Kiến trúc: Clean Architecture + DDD

Tài liệu này mô tả cách tổ chức code trong boilerplate và mọi service fork từ nó
(Identity-Service, …). Mục tiêu: nhìn đường dẫn là biết file thuộc tầng nào, và
`src/shared/` **giống hệt nhau** giữa các service để đồng bộ bằng cách copy thư mục.

## 1. Các tầng và dependency rule

```text
            presentation ──┐
                           ├──► application ──► domain
          infrastructure ──┘
```

| Tầng | Chứa gì | Được import |
|---|---|---|
| `domain/` | Entity, aggregate root, value object, domain event, domain exception, repository interface | Chỉ `domain/` khác. **Không** import `@nestjs/*`, `typeorm`, `express` |
| `application/` | Command/query + handler, port (interface cho hạ tầng), kiểu phân trang, contract xác thực | `domain/`, `application/`. Được dùng decorator của `@nestjs/cqrs`/`@nestjs/common` để đăng ký handler và `@Inject` port |
| `infrastructure/` | TypeORM entity, repository, mapper, adapter RabbitMQ, scheduler, CLI, đọc cấu hình | Mọi tầng trừ `presentation/` |
| `presentation/` | Controller, request/response DTO, guard, decorator, filter, interceptor, pipe, subscriber RabbitMQ | `application/`, `domain/`, (và `infrastructure/` khi chỉ để wiring) |

Hệ quả cụ thể:

- Repository interface nằm ở `domain/repositories/` và chỉ nhận/trả kiểu domain. Vì vậy
  `TransactionContext` nằm ở `shared/domain/repositories/transaction-context.ts`.
- Đọc danh sách / phân trang **không** đặt trên repository của aggregate. Khai báo một
  query-service port trong `application/ports/` (trả `PaginatedResult<T>`), implement ở
  `infrastructure/` bằng `TypeOrmPaginator`.
- `UserRole`/`UserStatus` là shared kernel nên nằm ở `shared/domain/enums`: aggregate `User` của
  Identity cần chúng, và domain không được import `application/`.
- Handler không đọc `ApiConfigService` trực tiếp. Module cung cấp cấu hình qua DI token
  (xem `OUTBOX_DI_TOKEN.CONFIG` trong `modules/outbox/outbox.module.ts`).
- Command/query không import request DTO. File command khai báo `export interface <Tên>Input`
  (vd. `UserLockInput`) và `XCommand.create(input)` nhận kiểu đó; request DTO
  `implements <Tên>Input` (presentation → application, đúng chiều). Đổi/xoá field bắt buộc ở
  DTO mà quên cập nhật thì compiler báo lỗi. Query handler trả kiểu domain/`PaginatedResult`, controller map sang response DTO.
- Import chéo module tuân theo cùng chiều phụ thuộc: `domain/` và `application/` của module
  này không được import `infrastructure/`/`presentation/` của **bất kỳ** module nào. Import
  cùng tầng giữa hai module được phép, ví dụ quan hệ TypeORM giữa `UserEntity` và
  `RefreshTokenEntity` (cùng một database).

## 2. `src/` tổng quan

```text
src/
├── main.ts, app.module.ts
├── config/service.constants.ts   # class ServiceConstants: MỌI giá trị riêng của service
│                                  # (PATH, TITLE, DESCRIPTION, DEFAULT_DATABASE_NAME)
├── database/migrations/           # migration của cả service (một timeline chung)
├── shared/                        # giống hệt nhau giữa các service — KHÔNG sửa riêng lẻ
└── modules/<context>/             # seed nằm trong module: infrastructure/seeds/*.seeder.ts
```

Migration để chung vì TypeORM chạy chúng theo một thứ tự timestamp duy nhất, ghi vào một
bảng `migrations`, và một migration có thể đụng bảng của nhiều module (FK). Seed thì
thuộc về module sở hữu dữ liệu: nó dùng TypeORM entity (và service như password hasher)
của chính module đó, nên xoá/tách module thì seed đi theo.

## 3. `src/shared/`

```text
shared/
├── shared.module.ts               # @Global: Config, TypeORM, RabbitMQ, UnitOfWork
├── security.module.ts             # guard toàn cục + AccessTokenVerifier
├── domain/                        # shared kernel
│   ├── base/                      # BaseEntity, AggregateRoot, DomainEvent
│   ├── enums/                     # UserRole, UserStatus (dùng chung mọi service)
│   ├── exceptions/                # DomainException (gốc của mọi lỗi nghiệp vụ), ValidationException
│   ├── repositories/              # BaseRepository, TransactionContext
│   └── value-objects/             # Uuid (+ generateUuid, isValidUuid), SortOrder
├── application/
│   ├── auth/                      # AuthenticatedUser, AuthErrorCode
│   ├── messaging/                 # IntegrationEvent, OutboxConfig
│   ├── pagination/                # OffsetPageQuery, PaginatedResult, OffsetPageInfo
│   ├── ports/                     # IUnitOfWork, IMessageBrokerPublisher
│   └── di-tokens.ts               # UNIT_OF_WORK_DI_TOKEN, MESSAGE_BROKER_DI_TOKEN
├── infrastructure/
│   ├── config/                    # ApiConfigService, config-value, *.config.ts
│   ├── database/                  # TypeORM module/options, data-source (CLI), AbstractEntity,
│   │                              # transaction/ (UnitOfWork), pagination/ (TypeOrmPaginator)
│   ├── messaging/rabbitmq/        # publisher, consumer registry, retry/DLQ
│   └── security/                  # AccessTokenVerifier, JwtPayload
└── presentation/
    ├── decorators/                # ApiSuccessResponse, ResponseCode, auth/ (@Public, @Roles, …)
    ├── guards/                    # ServiceToken, JwtAuth, Roles, ActiveUser
    ├── validators/                # @IsRequired, @IsUuid (class-validator)
    ├── pagination/                # DTO phân trang cho Swagger
    └── http/                      # filters/, interceptors/, pipes/, middleware/, bootstrap/ (swagger, logging),
                                   # authenticated-request.ts
```

`shared/` chỉ đọc giá trị riêng của service qua `ServiceConstants` (`config/service.constants.ts`). Cần thêm
một giá trị khác nhau giữa các service → thêm vào file đó, không rẽ nhánh trong `shared/`.

## 4. Layout một module

```text
modules/<context>/
├── <context>.module.ts
├── <context>.di-token.ts
├── domain/
│   ├── entities/                  # aggregate + *.props.ts
│   ├── value-objects/
│   ├── events/
│   ├── exceptions/
│   ├── repositories/              # interface (port) của aggregate
│   └── constants/
├── application/
│   ├── commands/<noun-verb>/      # <x>.command.ts + <x>.command.handler.ts
│   ├── queries/<noun-verb>/       # <x>.query.ts + <x>.query.handler.ts (+ <x>.result.ts)
│   ├── event-handlers/
│   └── ports/                     # interface cho dịch vụ hạ tầng (token, hash, query service…)
├── infrastructure/
│   ├── persistence/               # *.typeorm-entity.ts, *.repository.ts, mappers/
│   ├── seeds/                     # *.seeder.ts (npm run seed:run)
│   ├── services/                  # implement của application/ports
│   ├── config/, scheduler/, cli/
└── presentation/
    ├── http/                      # controllers/, requests/, responses/, constants/
    └── messaging/                 # RabbitMQ subscriber + consumer constants
```

Chỉ tạo thư mục khi có file; không giữ thư mục rỗng bằng `.gitkeep`.

### Quy ước đặt tên use case

`<noun>-<verb>[-<qualifier>]`: aggregate trước, hành động sau. Áp dụng cho thư mục, tên
file và tên class, để các use case của cùng một aggregate nằm cạnh nhau khi sắp xếp:

| Thư mục | Class |
|---|---|
| `commands/sample-create/` | `SampleCreateCommand`, `SampleCreateCommandHandler` |
| `queries/sample-get-by-id/` | `SampleGetByIdQuery`, `SampleGetByIdQueryHandler` |
| `commands/password-reset-request/` | `PasswordResetRequestCommand` |

Request/response DTO giữ tên theo API (vd. `CreateSampleRequest`) vì tên class xuất hiện
trong schema Swagger.

### Import

- Cùng một module (hoặc cùng một tầng của `shared/`): import tương đối (`../../domain/...`).
- Khác module / khác tầng: import tuyệt đối theo `baseUrl: ./src` (`shared/...`, `modules/...`,
  `config/...`). Nest CLI tự đổi thành đường dẫn tương đối khi build.

## 5. Thêm module mới (vd. `products`)

1. `domain/`: `entities/product.entity.ts` (kế thừa `AggregateRoot` nếu phát event),
   `repositories/product.repository.ts` (kế thừa `BaseRepository<ProductEntity>`),
   `exceptions/` (kế thừa `DomainException`).
2. `products.di-token.ts`: `PRODUCT_DI_TOKEN = { REPOSITORY: Symbol('PRODUCT_REPOSITORY') }`.
3. `infrastructure/persistence/`: `product.typeorm-entity.ts` (kế thừa `AbstractEntity`,
   tên file **phải** kết thúc bằng `.typeorm-entity.ts`; file có `@Entity` đặt sai tên/sai
   thư mục sẽ làm app và CLI dừng ngay khi khởi động với thông báo chỉ rõ file),
   `product.repository.ts`, `mappers/product.mapper.ts`.
4. `application/commands/product-create/`, `application/queries/product-get-by-id/`.
5. `presentation/http/`: controller, `requests/`, `responses/`, `constants/` (response code).
6. `products.module.ts` đăng ký provider theo DI token; import vào `app.module.ts`.
7. Migration: `npm run migration:generate -- src/database/migrations/<Name>`.

## 6. Đồng bộ `shared/` sang service khác

`shared/` là bản copy, không phải package. Sửa ở boilerplate trước, rồi:

```bash
# từ thư mục PBL6/
cp -r boilerplate/src/shared/. <Service>/src/shared/
diff -rq --strip-trailing-cr boilerplate/src/shared <Service>/src/shared   # phải rỗng
```

Nếu một service cần hành vi khác, đưa phần khác biệt vào `config/service.constants.ts`
hoặc vào module của service đó (provider override), không sửa `shared/` tại chỗ.

## 7. Kiểm tra dependency rule

Các lệnh sau phải không in ra gì:

```bash
grep -rnE "from '(@nestjs|typeorm|express)" src/shared/domain src/modules/*/domain
grep -rnE "from '[^']*(infrastructure|presentation)" src/shared/domain src/shared/application src/modules/*/domain src/modules/*/application
grep -rnE "from '[^']*application" src/shared/domain src/modules/*/domain
```

Repository của aggregate chỉ kế thừa `BaseRepository` khi thật sự hỗ trợ đủ `save`,
`findById`, `delete`; không viết method `throw new Error('Method not implemented.')`.
Ví dụ `IAuthRepository` (refresh token chỉ revoke, không xoá) tự khai báo method riêng.

## 8. Audit thao tác quản trị user (P11-04)

Identity dùng module `src/modules/audit`, được `SharedModule` import. Module bind
`AUDIT_RECORDER_DI_TOKEN` sang `TypeOrmAuditRecorder`; decorator và explorer chỉ
phụ thuộc port, không biết cách lưu DB. Tiếp tục dùng module và adapter hiện có
từ P11-10, không tạo thêm module `audit-log` hoặc sửa Unit of Work.

`@Audited` đặt trên `execute()` của bốn handler:

| Handler | Action | Metadata |
|---|---|---|
| `user-lock` | `user.locked` | `{ lockReason }` |
| `user-unlock` | `user.unlocked` | `{}` |
| `user-update-admin` | `user.updated` | `{ changedFields }` |
| `user-delete` | `user.deleted` | `{}` |

Actor là `command.adminId`, lấy từ `@CurrentUser()` trong controller; entity là
`command.userId`. Không nhận actor từ request body. Handler không gọi recorder
thủ công. Sau khi transaction nghiệp vụ commit, explorer tính các resolver và
await recorder trong một transaction riêng. Lỗi nghiệp vụ giữ nguyên và không
ghi audit. `skipIf` hoặc resolver/recorder lỗi đều thuộc bước audit:
`onError: 'log'` (mặc định) log action/entityId và loại lỗi, vẫn trả kết quả;
`onError: 'throw'` ném lỗi audit. Không log command, user, metadata hoặc thông báo
lỗi có thể chứa dữ liệu nhạy cảm.

API `PATCH /users/{userId}` vẫn chỉ hỗ trợ `name` và `phone`. Handler trả nội bộ
`UserUpdateAdminResult = { user, changedFields }`; controller chỉ dùng `user` để
giữ nguyên HTTP response. So sánh tên sau trim và phone bằng `Phone.equals()`
sau `Phone.create()`; `+84...` và `0...` tương đương không tính là thay đổi.
`changedFields` chỉ chứa `name`, `phone`, theo thứ tự đó; không đổi giá trị thì
`skipIf` bỏ ghi audit. Payload rỗng vẫn trả lỗi nghiệp vụ hiện có.

Adapter kiểm tra action, source service và metadata trước khi mở transaction
hoặc ghi SQL. Key ngoài allowlist bị loại:

- `user.locked`: bắt buộc `lockReason` là string.
- `user.unlocked`, `user.deleted`: metadata luôn `{}`.
- `user.updated`: bắt buộc `changedFields` là mảng chỉ gồm `name`/`phone`; bỏ
  trùng và chuẩn hóa thứ tự. Chỉ lưu tên field, không lưu số điện thoại hoặc giá
  trị cũ/mới.
- `building.approved`, `building.rejected`: chỉ `note` là string hoặc null;
  thiếu note thì dùng null. Chưa triển khai consumer building trong task này.

`AuditEntry.sourceService` tùy chọn, chỉ nhận `identity`/`tenancy`, mặc định
`identity` khi bỏ qua field; giá trị khác, kể cả null, bị từ chối trước SQL.
Explorer lấy `occurredAt` ngay sau khi handler hoàn tất, trước khi
mở transaction audit. `occurredAt` là thời điểm thao tác/sự kiện, được giữ nguyên
khi caller truyền vào và mặc định thời điểm ghi nếu thiếu; `createdAt` là thời
điểm lưu DB.
Caller từ event cần truyền `occurredAt` của event và `sourceEventId`.

Có transaction context thì adapter dùng chính context đó. Không có thì mở
transaction riêng. Khi có `sourceEventId`, câu INSERT chỉ bỏ qua conflict trên
`source_event_id`, giữ nguyên bản ghi đầu tiên; các lỗi DB khác vẫn được ném ra.

Migration `1795440754831-UpgradeAuditLogsForUserActions.ts` nâng cấp bảng đã có:
thêm `source_service varchar(30) NOT NULL DEFAULT 'identity'`, backfill metadata
NULL thành `{}` rồi đặt `metadata NOT NULL DEFAULT '{}'::jsonb`, thêm index
`created_at` và `(action, created_at)`. Giữ `source_event_id` dạng text nullable,
unique; giữ index actor/entity, hai timestamp và không thêm FK tới users. Revert
khôi phục schema cũ, không đổi các `{}` đã backfill trở lại NULL.
