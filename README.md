# NestJS Clean Architecture & CQRS Boilerplate

## Tài liệu xác thực

JWT sử dụng chữ ký RSA (`RS256`). Xem [tài liệu xác thực JWT bằng RSA](docs/jwt-rsa-authentication.md) để biết cách tạo key, cấu hình environment, sử dụng JWKS, xác thực token và rotate key.

Boilerplate chuẩn doanh nghiệp (Enterprise-ready) tinh gọn và rõ ràng, được xây dựng dựa trên **Clean Architecture**, **Domain-Driven Design (DDD)** và **CQRS (Command Query Responsibility Segregation)** trên nền tảng **NestJS** và **TypeORM (PostgreSQL)**.

---

## 🚀 Tính năng nổi bật (Key Features)

- **Kiến trúc phân tầng sạch (Clean Architecture & DDD)**: Tách biệt hoàn toàn giữa tầng Domain, Use-case (Application), Infrastructure và Presentation. Business logic không phụ thuộc vào framework hay cơ sở dữ liệu.
- **CQRS Pattern (@nestjs/cqrs)**: Tách bạch rõ ràng giữa Commands (Ghi/Sửa/Xóa dữ liệu), Queries (Đọc dữ liệu) và Events (Xử lý sự kiện nội bộ).
- **Dependency Inversion (DI Tokens)**: Sử dụng Symbol DI Token để đảo ngược phụ thuộc giữa Domain và Infrastructure.
- **Cơ sở dữ liệu (TypeORM & PostgreSQL)**: Cấu hình Data Source tối ưu, tự động mapping snake_case naming strategy, hỗ trợ Migration và Database Seeding (`typeorm-extension`).
- **Global Exception Filter chuẩn Clean Architecture**: Tự động nhận diện Domain Exception (`BaseException`), NestJS `HttpException`, và Validation errors để map HTTP status code chuẩn xác (404, 409, 400...).
- **Tài liệu API tự động (Swagger/OpenAPI)**: Tự động sinh tài liệu API trực quan tại `/api/v1/identity/swagger` (JSON: `/api/v1/identity/swagger/json`). Health check: `/api/v1/identity/health`.
- **Bộ khung thuần khiết (Pure Skeleton)**: Không chứa logic nghiệp vụ dư thừa, dễ dàng sao chép và mở rộng cho bất kỳ dự án nào.

---

## 📁 Cấu trúc thư mục (Directory Structure)

```text
Identity-Service/
├── .github/workflows/              # CI/CD và Supabase database keepalive
├── .env.example                    # Biến môi trường mẫu
├── docker-compose.yml              # Chạy backend container (DB dùng Supabase)
└── backend/
    ├── Dockerfile                  # Multi-stage Docker build
    ├── start.sh                    # Script chạy migration -> start app
    ├── package.json
    ├── scripts/                    # Keepalive cho Supabase
    ├── tsconfig.json
    └── src/
        ├── main.ts                 # Bootstrap REST API & Swagger
        ├── app.module.ts           # Root module
        │
        ├── filter/                 # Exception filters (LoggingExceptionFilter)
        ├── utils/                  # Tiện ích chung (UUID crypto)
        │
        ├── shared/                 # Core dùng chung cho toàn bộ ứng dụng
        │   ├── shared.module.ts    # Global Module
        │   ├── configuration/      # Config Swagger, Logging, Naming Strategy
        │           ├── services/           # API and database configuration services
        │   ├── domain/             # Base Entity, Base Repo, Base Exception, VOs
        │   └── infra/              # TypeORM setup & config
        │
        └── modules/
            └── sample/             # [MODULE KHUNG MẪU] Skeleton tham chiếu chuẩn
                ├── sample.di-token.ts
                ├── sample.module.ts
                ├── domain/
                │   ├── entities/sample.entity.ts
                │   ├── repositories/sample.repository.ts
                │   └── exceptions/sample-not-found.exception.ts
                ├── use-case/
                │   ├── commands/
                │   │   ├── create-sample.command.ts
                │   │   └── create-sample.command.handler.ts
                │   └── queries/
                │       ├── get-sample-by-id.query.ts
                │       └── get-sample-by-id.query.handler.ts
                ├── infra/
                │   ├── persistence/
                │   │   ├── sample.typeorm-entity.ts
                │   │   └── sample.repository.ts
                │   └── mappers/sample.mapper.ts
                └── presentation/
                    ├── controllers/sample.controller.ts
                    ├── request/create-sample.request.ts
                    └── response/sample.response.dto.ts
```

---

## 🔄 Luồng xử lý CQRS (CQRS Architecture Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Controller as SampleController (Presentation)
    participant CommandBus as CommandBus (CQRS)
    participant Handler as CreateSampleCommandHandler
    participant Domain as SampleEntity (Domain)
    participant Repo as SampleRepository (Infra)
    participant DB as Supabase PostgreSQL

    Client->>Controller: POST /api/v1/samples (CreateSampleRequest)
    Controller->>CommandBus: execute(new CreateSampleCommand(...))
    CommandBus->>Handler: execute(command)
    Handler->>Domain: SampleEntity.create(props)
    Handler->>Repo: save(sample)
    Repo->>DB: INSERT INTO samples
    Handler-->>Controller: Return Domain SampleEntity
    Controller-->>Client: 201 Created (SampleResponseDto)
```

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### Cách 1: Khởi chạy backend bằng Docker Compose

Docker Compose chỉ chạy backend; PostgreSQL được kết nối qua `DATABASE_URL` trên Supabase.
Đặt `DATABASE_URL` trong file `.env` ở thư mục `Identity-Service` trước khi chạy:

```bash
cd Identity-Service
docker compose up --build -d
```

- **Backend API**: `http://localhost:3001/api/v1`
- **Swagger Docs**: `http://localhost:3001/api/v1/identity/swagger`
- **Health**: `http://localhost:3001/api/v1/identity/health`

---

### Cách 2: Khởi chạy trực tiếp trên máy (Local Development)

#### 1. Cài đặt dependencies:
```bash
cd Identity-Service/backend
npm ci
```

#### 2. Cấu hình biến môi trường:
Đặt `DATABASE_URL` cho Supabase trong file `.env` tại thư mục `Identity-Service` (không ghi đè file `.env` hiện có). `MIGRATION_DATABASE_URL` có thể được đặt riêng nếu migration cần kết nối trực tiếp; khi bỏ trống, migration dùng `DATABASE_URL`. `DB_SSL` có thể để trống để tự nhận diện Supabase.

#### 3. Chạy Database Migrations:
```bash
npm run migration:run
```

#### 4. Khởi chạy ứng dụng:
```bash
npm run start:dev
```

#### 5. Kiểm tra kết nối Supabase (tùy chọn):
Từ thư mục `Identity-Service/backend`, chạy:
```bash
npx --yes tsx scripts/keep-alive.ts --dry-run
```

GitHub Actions keepalive chạy theo lịch mỗi ngày. Thêm secret `SUPABASE_DATABASE_URL` trong repository settings; có thể chạy thủ công ở chế độ kiểm tra kết nối (`dry_run`). Workflow deploy cần `DOCKERHUB_USERNAME` và `DOCKERHUB_TOKEN`; để bật deploy lên EC2, thêm `EC2_HOST`, `EC2_USER` và `EC2_SSH_KEY`.

---

## 📋 Hướng dẫn thêm Module mới chuẩn Clean Architecture & CQRS

Khi bạn muốn thêm một tính năng/domain mới (ví dụ `products`):

### Bước 1: Tạo cấu trúc thư mục
Tạo thư mục `src/modules/products/` với các thư mục con:
- `domain/`: `entities/`, `repositories/`, `exceptions/`
- `use-case/`: `commands/`, `queries/`
- `infra/`: `persistence/`, `mappers/`
- `presentation/`: `controllers/`, `request/`, `response/`

### Bước 2: Định nghĩa DI Token
Tạo `products/product.di-token.ts`:
```typescript
export const PRODUCT_DI_TOKEN = {
  REPOSITORY: Symbol("PRODUCT_REPOSITORY"),
} as const;
```

### Bước 3: Xây dựng Domain Model & Repository Interface
1. Tạo Entity kế thừa `BaseEntity` tại `domain/entities/product.entity.ts`.
2. Tạo interface `ProductRepository` kế thừa `BaseRepository<ProductEntity>` tại `domain/repositories/product.repository.ts`.

### Bước 4: Tạo Tầng Hạ Tầng (Infrastructure)
1. Tạo TypeORM entity kế thừa `AbstractEntity` tại `infra/persistence/product.typeorm-entity.ts`.
2. Tạo mapper chuyển đổi 2 chiều giữa Domain Entity và TypeORM Entity tại `infra/mappers/product.mapper.ts`.
3. Tạo repository class triển khai interface `ProductRepository` tại `infra/persistence/product.repository.ts`.

### Bước 5: Viết Use Cases (CQRS)
1. **Command**: Tạo `CreateProductCommand` và `CreateProductCommandHandler`.
2. **Query**: Tạo `GetProductByIdQuery` và `GetProductByIdQueryHandler`.

### Bước 6: Xây dựng Presentation Layer
1. Tạo DTOs validation tại `presentation/request/` và `presentation/response/`.
2. Tạo Controller inject `CommandBus` và `QueryBus` tại `presentation/controllers/product.controller.ts`.

### Bước 7: Khai báo Module
Tạo `products.module.ts`:
```typescript
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([ProductTypeormEntity])],
  controllers: [ProductController],
  providers: [
    {
      provide: PRODUCT_DI_TOKEN.REPOSITORY,
      useClass: TypeOrmProductRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [PRODUCT_DI_TOKEN.REPOSITORY],
})
export class ProductsModule {}
```
Cuối cùng, import `ProductsModule` vào `app.module.ts`.

---

## 📜 Các lệnh Scripts hữu ích (NPM Scripts)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run start:dev` | Chạy ứng dụng ở chế độ dev (watch mode) |
| `npm run build` | Biên dịch TypeScript sang JavaScript trong `dist/` |
| `npm run lint` | Kiểm tra và sửa lỗi coding convention với ESLint |
| `npm run format` | Tự động format code với Prettier |
| `npm run migration:create -- name=MigrationName` | Tạo một file migration mới |
| `npm run migration:generate -- name=MigrationName` | Tự động sinh migration từ Entity thay đổi |
| `npm run migration:run` | Áp dụng các migration chưa chạy vào Database |
| `npm run migration:revert` | Hoàn tác migration gần nhất |
| `npm run test` | Chạy unit test với Jest |

---

## 🛡️ License

Dự án phát hành theo giấy phép MIT.
