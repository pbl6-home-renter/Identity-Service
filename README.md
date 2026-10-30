<div align="center">

<h1>Rentify · Identity Service</h1>

<p>Dịch vụ xác thực và định danh của Rentify: tài khoản, người dùng, hồ sơ chủ trọ, media — phát hành JWT RS256 và công bố JWKS.</p>

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-24.18.0-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-12-E0234E?style=flat-square&logo=nestjs&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="TypeORM" src="https://img.shields.io/badge/TypeORM-1.x-FE0803?style=flat-square&logo=typeorm&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white">
  <img alt="RabbitMQ" src="https://img.shields.io/badge/RabbitMQ-topic_exchange-FF6600?style=flat-square&logo=rabbitmq&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/JWT-RS256_%2B_JWKS-000000?style=flat-square&logo=jsonwebtokens&logoColor=white">
  <img alt="Cloudflare R2" src="https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-linux%2Famd64-2496ED?style=flat-square&logo=docker&logoColor=white">
</p>

<p>
  <a href="https://github.com/pbl6-home-renter/Identity-Service/actions/workflows/deploy.yml"><img alt="Deploy" src="https://github.com/pbl6-home-renter/Identity-Service/actions/workflows/deploy.yml/badge.svg"></a>
  <a href="https://github.com/pbl6-home-renter/Identity-Service/actions/workflows/db-keepalive.yml"><img alt="DB Keepalive" src="https://github.com/pbl6-home-renter/Identity-Service/actions/workflows/db-keepalive.yml/badge.svg"></a>
</p>

<p>
  <a href="#giới-thiệu">Giới thiệu</a> •
  <a href="#bắt-đầu-nhanh">Bắt đầu nhanh</a> •
  <a href="#biến-môi-trường">Biến môi trường</a> •
  <a href="#kiến-trúc">Kiến trúc</a> •
  <a href="#api">API</a> •
  <a href="#sự-kiện-phát-hành-outbox">Sự kiện</a> •
  <a href="#triển-khai">Triển khai</a> •
  <a href="#đóng-góp">Đóng góp</a>
</p>

</div>

## Giới thiệu

**Identity Service** là nguồn sự thật về danh tính trong hệ thống Rentify. Service quản lý tài khoản người thuê (`tenant`), chủ trọ (`landlord`) và quản trị viên (`admin`); là service **duy nhất** giữ private key để ký access token `RS256`, đồng thời công bố public key qua endpoint JWKS để API Gateway và các service khác tự xác thực token.

Service được fork từ [`boilerplate`](https://github.com/pbl6-home-renter/boilerplate) nên dùng chung kiến trúc **Clean Architecture + DDD + CQRS**, transactional outbox/inbox và RabbitMQ với các backend service khác. Cổng mặc định: **3001**; path segment sau gateway: **`identity`** (`src/config/service.constants.ts`).

## Tính năng nổi bật

- **Đăng ký / đăng nhập** bằng email hoặc số điện thoại, mật khẩu băm bằng `bcrypt`.
- **JWT RS256 + JWKS** — access token sống 15 phút, ký bằng private key; public key công bố tại `/api/v1/.well-known/jwks.json` (hỗ trợ `kid` để rotate key).
- **Refresh token rotation** với `family_id` và **reuse detection**: dùng lại token đã revoke → revoke cả family, trả `401 TOKEN_REUSED`.
- **Đặt lại mật khẩu** bằng token dùng một lần (TTL 15 phút), phát qua sự kiện `user.password_reset_requested`.
- **Quản trị người dùng** (admin): tìm kiếm, xem chi tiết (kèm thống kê lấy từ Tenancy-Service), cập nhật, khóa/mở khóa, xóa mềm. Token bị thu hồi khi user bị khóa, xóa hoặc đổi mật khẩu.
- **Hồ sơ chủ trọ** — tài khoản nhận tiền (`payoutAccount`) được cập nhật qua `PATCH /api/v1/me` (chỉ landlord).
- **Media** — upload hai bước bằng presigned URL lên Cloudflare R2 (bucket public/private), phân quyền theo mục đích sử dụng (`avatar`, `cover_photo`, `cccd_front`, `contract_signed`, …).
- **Transactional outbox** → RabbitMQ topic exchange cho mọi sự kiện `user.*` / `landlord.*`.
- **Zero-trust**: service tự verify JWT, không tin header `x-user-*`; endpoint `internal/*` bảo vệ bằng `X-Service-Token`.
- **Global exception filter** map `DomainException`, `HttpException` và lỗi validation về response envelope chuẩn.
- **Swagger** tự sinh tại `/api/v1/identity/swagger`.

## Tech stack

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js `24.18.0` (`.nvmrc`, `engines >=24.18.0`) |
| Framework | NestJS 12, `@nestjs/cqrs`, `@nestjs/swagger` |
| Ngôn ngữ | TypeScript 6 |
| Cơ sở dữ liệu | PostgreSQL (Supabase) qua TypeORM 1.x, seed bằng `typeorm-extension` |
| Messaging | RabbitMQ (`@golevelup/nestjs-rabbitmq`, `amqplib`) |
| Xác thực | `jose` (ký/verify RS256, JWKS), `passport-jwt`, `bcrypt` |
| Lưu trữ file | Cloudflare R2 qua `@aws-sdk/client-s3` + `s3-request-presigner` |
| Chất lượng code | `oxlint`, Prettier, Husky + lint-staged |
| Đóng gói | Docker multi-stage (`node:24.18.0-slim`) |

## Bắt đầu nhanh

### Yêu cầu

- Node.js `24.18.0` và npm
- Một database PostgreSQL (Supabase hoặc local)
- RabbitMQ (local: `amqp://guest:guest@localhost:5672`)
- OpenSSL để tạo cặp khóa RSA
- *(Tùy chọn)* Tài khoản Cloudflare R2 cho các endpoint media

### Cài đặt

```bash
git clone https://github.com/pbl6-home-renter/Identity-Service.git
cd Identity-Service
npm ci
```

### Cấu hình

```bash
cp .env.example .env
```

Điền tối thiểu `DATABASE_URL` (hoặc nhóm `DB_*`), `RABBITMQ_URL` và cặp khóa JWT. Tạo cặp khóa RSA 2048-bit:

```bash
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
```

Đưa nội dung PEM vào `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` dưới dạng một dòng, thay xuống dòng bằng chuỗi `\n` literal:

```env
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

> [!WARNING]
> Không commit private key hay file `.env`. Ở production, lưu `JWT_PRIVATE_KEY` trong secret manager. Chỉ Identity Service được giữ private key — gateway và các service khác chỉ dùng public key qua JWKS.

### Chạy

```bash
npm run migration:run   # tạo bảng users, refresh/password-reset tokens, media, outbox/inbox
npm run seed:run        # (tùy chọn) tạo tài khoản admin mặc định từ DEFAULT_ADMIN_*
npm run start:dev
```

| URL | Mô tả |
|---|---|
| `http://localhost:3001/api/v1` | Base URL của API |
| `http://localhost:3001/api/v1/identity/swagger` | Swagger UI (JSON: `/api/v1/identity/swagger/json`) |
| `http://localhost:3001/api/v1/identity/health` | Health check |
| `http://localhost:3001/api/v1/.well-known/jwks.json` | JWKS |

Kiểm tra kết nối Supabase mà không ghi gì (tùy chọn):

```bash
npx --yes tsx scripts/keep-alive.ts --dry-run
```

## Biến môi trường

Tất cả biến lấy từ [`.env.example`](.env.example). Bảng dưới chỉ ghi giá trị mặc định an toàn.

| Biến | Bắt buộc | Mô tả |
|---|:---:|---|
| `PORT` | | Cổng HTTP, mặc định `3001` |
| `APP_NAME`, `NODE_ENV`, `API_DOMAIN`, `API_VERSION`, `LOG_LEVEL` | | Thông tin ứng dụng và mức log (`debug`) |
| `ENABLE_DOCUMENTATION` | | Bật Swagger (`true`) |
| `DATABASE_URL` | Có\* | Connection string PostgreSQL/Supabase |
| `MIGRATION_DATABASE_URL` | | URL riêng cho migration (kết nối trực tiếp); trống → dùng `DATABASE_URL` |
| `KEEPALIVE_DATABASE_URL` | | URL riêng cho `scripts/keep-alive.ts` |
| `DB_SSL` | | Để trống để tự nhận diện Supabase |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Có\* | Dùng khi không có `DATABASE_URL` (mặc định `localhost:5432`, DB `identity_db`) |
| `ENABLE_ORM_LOGS` | | Log SQL của TypeORM (`false`) |
| `JWT_PRIVATE_KEY` | Có | Private key PEM dùng để ký JWT |
| `JWT_PUBLIC_KEY` | Có | Public key PEM dùng để verify và sinh JWKS |
| `JWT_KEY_ID` | | `kid` của khóa hiện tại (`rentify-identity-2026-01`) |
| `JWT_ISSUER` / `JWT_AUDIENCE` | | Claim `iss` / `aud` (`rentify-identity` / `rentify-api`) |
| `SERVICE_TOKEN` | | Shared secret cho endpoint `internal/*`; trống = tắt |
| `TENANCY_SERVICE_URL` | | URL nội bộ của Tenancy-Service (`http://localhost:3002`); trống → lời gọi trả `503` |
| `INTERNAL_HTTP_TIMEOUT_MS` | | Timeout gọi HTTP nội bộ (`3000`) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | | Thông tin Cloudflare R2; trống → endpoint media trả `503` |
| `R2_PUBLIC_BUCKET`, `R2_PUBLIC_BASE_URL`, `R2_PRIVATE_BUCKET` | | Bucket public (cần bật public access) và private |
| `MEDIA_UPLOAD_TTL_SECONDS`, `MEDIA_MAX_SIZE_BYTES` | | TTL presigned URL (`900`) và kích thước tối đa (`10485760`) |
| `RABBITMQ_URL` | Có | URL broker (`amqp://guest:guest@localhost:5672`) |
| `RABBITMQ_EXCHANGE`, `RABBITMQ_EXCHANGE_TYPE` | | Exchange `pbl6.events`, kiểu `topic` |
| `RABBITMQ_PREFETCH`, `RABBITMQ_CONNECT_TIMEOUT_MS` | | Prefetch (`10`), timeout kết nối (`10000`) |
| `RABBITMQ_PUBLISH_MANDATORY` | | `false` — chưa có consumer bind `user.*`; bật lại khi Tenancy/Community subscribe |
| `RABBITMQ_CONSUMER_MAX_ATTEMPTS`, `RABBITMQ_CONSUMER_RETRY_DELAY_MS` | | Retry phía consumer (`5`, `10000`) |
| `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS` | | Tài khoản RabbitMQ (`guest`) |
| `OUTBOX_RELAY_ENABLED`, `OUTBOX_RELAY_INTERVAL_MS`, `OUTBOX_RELAY_BATCH_SIZE` | | Relay outbox (`true`, `1000`, `100`) |
| `OUTBOX_PUBLISH_TIMEOUT_MS`, `OUTBOX_CLAIM_TIMEOUT_MS`, `OUTBOX_MAX_ATTEMPTS` | | `5000`, `60000`, `10` |
| `OUTBOX_RETRY_BASE_DELAY_MS`, `OUTBOX_RETRY_MAX_DELAY_MS` | | Backoff `1000` → `60000` |
| `OUTBOX_RETENTION_MS` | | `900000` (15 phút) — xóa sớm bản ghi đã publish vì `user.password_reset_requested` chứa raw reset token |
| `REDIS_HOST`, `REDIS_PORT` | | Có trong `.env.example` nhưng hiện code chưa sử dụng |
| `DEFAULT_ADMIN_ID`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`, `DEFAULT_ADMIN_PHONE` | | Tài khoản admin do `seed:run` tạo |

\* Cần `DATABASE_URL` **hoặc** nhóm `DB_*`.

> [!IMPORTANT]
> Đổi `DEFAULT_ADMIN_PASSWORD` trước khi chạy seed ở bất kỳ môi trường nào ngoài máy local.

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run start:dev` | Chạy ở chế độ watch |
| `npm run start:debug` | Watch + debugger |
| `npm run build` | Biên dịch sang `dist/` |
| `npm run start:prod` | Chạy bản build (`node dist/main`) |
| `npm run lint` / `lint:fix` | Kiểm tra / tự sửa với `oxlint src/` |
| `npm run format` / `format:check` | Prettier cho `src/**/*.ts` |
| `npm run migration:create -- src/database/migrations/<Name>` | Tạo migration rỗng |
| `npm run migration:generate -- src/database/migrations/<Name>` | Sinh migration từ thay đổi entity |
| `npm run migration:run` / `migration:revert` | Áp dụng / hoàn tác migration |
| `npm run migration:run:prod` | Chạy migration từ `dist/` (dùng trong `start.sh`) |
| `npm run schema:drop` | Xóa toàn bộ schema (cẩn thận) |
| `npm run seed:run` | Chạy seeder (`modules/*/infrastructure/seeds`) |
| `npm run outbox:requeue -- <message-id>` | Đưa một outbox message `FAILED` về hàng đợi (bản prod: `outbox:requeue:prod`) |

> [!NOTE]
> Repo chưa có test script. Husky `pre-commit` chạy `npm run format` rồi `lint-staged` (`oxlint --fix` + `prettier --write`).

## Cấu trúc thư mục

```text
Identity-Service/
├── .github/workflows/          # deploy.yml (build + deploy EC2), db-keepalive.yml (Supabase)
├── docs/
│   ├── architecture.md         # Quy ước Clean Architecture + DDD (chung với boilerplate)
│   └── jwt-rsa-authentication.md
├── scripts/keep-alive.ts       # Ping Supabase để DB không bị pause
├── Dockerfile                  # Multi-stage build
├── start.sh                    # migration:run:prod → node dist/main.js
└── src/
    ├── main.ts                 # Bootstrap: prefix api/v1 (trừ internal/*), Swagger, pipes
    ├── app.module.ts
    ├── config/service.constants.ts   # PATH = identity, tiêu đề Swagger, DB mặc định
    ├── database/migrations/
    ├── shared/                 # Bản copy y hệt boilerplate — KHÔNG sửa riêng ở đây
    └── modules/
        ├── auth/               # Đăng ký, đăng nhập, refresh/logout, reset mật khẩu, JWKS
        ├── users/              # Hồ sơ cá nhân (/me), quản trị user, lookup nội bộ, admin seeder
        ├── landlord-profiles/  # Aggregate hồ sơ chủ trọ (payout account) — không có controller riêng
        ├── media/              # Presigned upload lên Cloudflare R2
        ├── outbox/, inbox/     # Transactional outbox / consumer dedup
        └── health/
```

Mỗi module chia `domain/` → `application/` (`commands/<noun>-<verb>/`, `queries/<noun>-<verb>/`, `ports/`) ← `infrastructure/` và `presentation/`. Module `users` là ví dụ đầy đủ nhất. Chi tiết quy ước tầng, đặt tên use case, các bước thêm module mới và cách đồng bộ `shared/`: [`docs/architecture.md`](docs/architecture.md).

## Kiến trúc

### Luồng xác thực JWT / JWKS

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant GW as API Gateway
    participant ID as Identity Service
    participant SVC as Service khác (vd. Tenancy)

    Client->>GW: POST /api/v1/auth/login
    GW->>ID: chuyển tiếp
    ID->>ID: kiểm tra mật khẩu, ký access token RS256 (15 phút, kid)
    ID-->>Client: accessToken + refreshToken (lưu SHA-256 trong DB)

    Client->>GW: Request + Authorization: Bearer accessToken
    GW->>ID: GET /api/v1/.well-known/jwks.json (cache theo kid)
    GW->>GW: verify chữ ký, alg, iss, aud, exp (lọc sớm)
    GW->>SVC: chuyển tiếp, giữ nguyên Authorization
    SVC->>ID: lấy JWKS (cache, refresh khi gặp kid lạ)
    SVC->>SVC: tự verify token rồi phân quyền (quyết định cuối)
    SVC-->>Client: response

    Client->>GW: POST /api/v1/auth/refresh { refreshToken }
    GW->>ID: chuyển tiếp
    ID->>ID: revoke token cũ, cấp token mới cùng family_id
    ID-->>Client: accessToken mới + refreshToken mới
```

Claim của access token: `sub` (UUID), `role` (`tenant` / `landlord` / `admin`), `status` (`active` / `locked`), `iss`, `aud`, `exp`. Tài khoản bị khóa vẫn đăng nhập được; các service chặn chức năng dựa trên claim `status`. Identity tự verify bằng `JWT_PUBLIC_KEY` của chính nó (không gọi JWKS qua HTTP).

<details>
<summary>Chi tiết refresh token</summary>

| | |
|---|---|
| Dạng | Chuỗi ngẫu nhiên 32 byte (base64url); DB chỉ lưu SHA-256 |
| Thời hạn | 7 ngày (`rememberMe=true`) hoặc 1 ngày |
| Truyền | Body JSON `{ "refreshToken": "..." }` cho cả web và mobile |
| Rotation | `POST /api/v1/auth/refresh` revoke token cũ, cấp token mới cùng `family_id`, giữ nguyên thời hạn phiên |
| Reuse detection | Dùng lại token đã revoke → revoke cả family, trả `401 TOKEN_REUSED` |
| Logout | `POST /api/v1/auth/logout` (cần access token) revoke family, trả `204` |

`role`/`status` trong access token mới được đọc lại từ DB, nên khóa/mở khóa có hiệu lực ở lần refresh kế tiếp (tối đa 15 phút).

</details>

Tạo khóa, cấu hình, cách service khác verify và quy trình **rotate key**: [`docs/jwt-rsa-authentication.md`](docs/jwt-rsa-authentication.md).

### Luồng CQRS + outbox

```mermaid
flowchart LR
    C["Controller (presentation)"] -->|execute| CB["CommandBus"]
    CB --> H["CommandHandler (application)"]
    H --> D["Aggregate (domain)"]
    H -->|"cùng transaction"| DB[("PostgreSQL: bảng nghiệp vụ + outbox")]
    R["Outbox relay"] -->|poll| DB
    R -->|"publish routing key user.* / landlord.*"| X{{"RabbitMQ exchange pbl6.events"}}
    X --> Q["Queue của service consumer (inbox dedup)"]
```

Đọc dữ liệu chéo service dùng HTTP nội bộ (GET, không retry, đi thẳng qua mạng private): Identity gọi `GET /internal/users/{userId}/stats` của Tenancy-Service khi admin xem chi tiết hoặc xóa user.

## API

Tất cả route public có prefix `/api/v1` và được gateway định tuyến tới service này. Mặc định mọi route cần access token hợp lệ (`JwtAuthGuard` toàn cục).

| Method | Path | Auth / Role | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản tenant hoặc landlord |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập bằng email hoặc số điện thoại |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token, cấp access token mới |
| `POST` | `/api/v1/auth/logout` | Đã đăng nhập (cho phép tài khoản bị khóa) | Revoke family refresh token của phiên |
| `POST` | `/api/v1/auth/password-reset-requests` | Public | Yêu cầu link đặt lại mật khẩu |
| `POST` | `/api/v1/auth/password-resets` | Public | Đặt lại mật khẩu bằng token dùng một lần |
| `GET` | `/api/v1/.well-known/jwks.json` | Public | Public key để verify chữ ký JWT |
| `GET` | `/api/v1/me` | tenant, landlord, admin (cho phép bị khóa) | Lấy thông tin người dùng hiện tại |
| `PATCH` | `/api/v1/me` | tenant, landlord, admin (cho phép bị khóa) | Cập nhật hồ sơ; landlord có thể gửi `payoutAccount` |
| `PUT` | `/api/v1/me/password` | tenant, landlord, admin (cho phép bị khóa) | Đổi mật khẩu |
| `GET` | `/api/v1/users` | admin | Liệt kê và tìm kiếm người dùng |
| `GET` | `/api/v1/users/:userId` | admin | Chi tiết người dùng (kèm thống kê từ Tenancy) |
| `PATCH` | `/api/v1/users/:userId` | admin | Cập nhật thông tin tài khoản |
| `POST` | `/api/v1/users/:userId/lock` | admin | Khóa tài khoản |
| `POST` | `/api/v1/users/:userId/unlock` | admin | Mở khóa tài khoản |
| `DELETE` | `/api/v1/users/:userId` | admin | Xóa mềm tài khoản |
| `POST` | `/api/v1/media/presign-upload` | Mọi role | Xin presigned URL để upload |
| `POST` | `/api/v1/media/:mediaId/complete-upload` | Mọi role | Xác nhận upload hoàn tất |
| `GET` | `/api/v1/media/:mediaId` | Public (file private vẫn cần token) | Lấy hoặc stream file |
| `DELETE` | `/api/v1/media/:mediaId` | Mọi role | Xóa media |
| `GET` | `/api/v1/identity/health` | Public | Health check |
| `GET` | `/internal/users?ids=...` | `X-Service-Token` | Lookup user cho service khác (ngoài `api/v1`, gateway không với tới) |

Tài liệu tham khảo:

- **Swagger UI**: `/api/v1/identity/swagger` (bật bằng `ENABLE_DOCUMENTATION=true`).
- **Hợp đồng OpenAPI chuẩn**: repo [`be`](https://github.com/pbl6-home-renter/be) — mọi thay đổi API phải cập nhật `src/` ở đó và bundle lại.
- [`docs/jwt-rsa-authentication.md`](docs/jwt-rsa-authentication.md) — xác thực JWT bằng RSA.
- [`docs/architecture.md`](docs/architecture.md) — kiến trúc và quy ước code.

## Sự kiện phát hành (outbox)

Các sự kiện được ghi vào bảng outbox trong cùng transaction với thay đổi nghiệp vụ, sau đó relay publish lên exchange `pbl6.events` (delivery at-least-once). Identity hiện **không** consume sự kiện nào từ RabbitMQ.

| Routing key | Phát sinh khi |
|---|---|
| `user.registered` | Đăng ký tài khoản mới |
| `user.updated` | Người dùng hoặc admin cập nhật thông tin |
| `user.locked` | Admin khóa tài khoản |
| `user.unlocked` | Admin mở khóa tài khoản |
| `user.deleted` | Admin xóa mềm tài khoản |
| `user.password_reset_requested` | Yêu cầu đặt lại mật khẩu (payload chứa raw reset token, TTL 15 phút) |
| `landlord.payout_account_updated` | Chủ trọ cập nhật tài khoản nhận tiền qua `PATCH /me` |

Khi một message chuyển sang `FAILED`, retry thủ công bằng `npm run outbox:requeue -- <message-id>`.

## Triển khai

Workflow [`deploy.yml`](.github/workflows/deploy.yml) chạy khi push lên `main` (hoặc `workflow_dispatch`):

1. Build image `linux/amd64` từ `Dockerfile` và push lên Docker Hub với tag `<DOCKERHUB_USERNAME>/identity-service:latest`.
2. SSH vào EC2 **internal**, `git pull` repo [`infra`](https://github.com/pbl6-home-renter/infra) rồi chạy `DEPLOY_STACK=internal bash ./scripts/deploy.sh identity`. Bước này tự bỏ qua nếu thiếu `EC2_HOST` / `EC2_SSH_KEY`.

Khi container khởi động, `start.sh` chạy `migration:run:prod` rồi `node dist/main.js`.

Workflow [`db-keepalive.yml`](.github/workflows/db-keepalive.yml) chạy hằng ngày (cron `17 3 * * *`) để Supabase không bị pause; có thể chạy thủ công với `dry_run` để chỉ kiểm tra kết nối.

| Secret | Dùng cho |
|---|---|
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Push image |
| `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` | Deploy lên EC2 (`EC2_USER` mặc định `ubuntu`) |
| `SUPABASE_DATABASE_URL` | Keepalive database |

> [!WARNING]
> Cổng `3001` chỉ mở trong mạng private giữa hai host EC2 — không bao giờ public. Client luôn đi qua API Gateway.

## Đóng góp

- Luồng nhánh: `main` ← `develop` ← `feature/<id>-<slug>` (cũng dùng `fix/`, `hotfix/`, `docs/`, `ci/`). Task ID theo `pm/phase-N/issues/`, ví dụ `feature/p6-08-user-lookup`.
- Mở PR vào `develop`, **squash merge**, cần ít nhất 1 reviewer. Không push thẳng lên `main` / `develop`.
- Commit message bằng tiếng Anh theo [Conventional Commits](https://www.conventionalcommits.org/), ví dụ `feat(auth): ...`, `fix: ...`, `ci(deploy): ...`.
- Trước khi mở PR: `npm run lint`, `npm run format:check`, `npm run build`, và kiểm tra dependency rule ở [`docs/architecture.md`](docs/architecture.md).
- Không sửa `src/shared/` riêng ở repo này — sửa ở `boilerplate` rồi đồng bộ sang.
- Mọi thay đổi API phải cập nhật hợp đồng OpenAPI trong repo [`be`](https://github.com/pbl6-home-renter/be).

## Hệ sinh thái Rentify

| Repo | Vai trò |
|---|---|
| [`api-gateway`](https://github.com/pbl6-home-renter/api-gateway) | Reverse proxy: định tuyến theo prefix, xác thực JWT/JWKS, rate limit |
| [**`Identity-Service`**](https://github.com/pbl6-home-renter/Identity-Service) | Xác thực, người dùng, hồ sơ chủ trọ; phát hành JWT RS256 |
| [`Tenancy-Service`](https://github.com/pbl6-home-renter/Tenancy-Service) | Tòa nhà, phòng, đơn vị hành chính |
| [`boilerplate`](https://github.com/pbl6-home-renter/boilerplate) | Template NestJS mà mọi backend service được fork từ |
| [`be`](https://github.com/pbl6-home-renter/be) | Hợp đồng OpenAPI 3.0 chuẩn (canonical) |
| [`fe`](https://github.com/pbl6-home-renter/fe) | Web cho chủ trọ (React + Vite) |
| [`mobile`](https://github.com/pbl6-home-renter/mobile) | Ứng dụng Android cho người thuê & chủ trọ |
| [`infra`](https://github.com/pbl6-home-renter/infra) | Docker Compose + Caddy cho hai host EC2 |

## Giấy phép

Dự án học thuật thuộc học phần PBL6 — Trường Đại học Bách khoa, Đại học Đà Nẵng. Chưa phát hành theo giấy phép mã nguồn mở.
