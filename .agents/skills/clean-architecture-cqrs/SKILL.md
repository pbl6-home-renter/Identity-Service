---
name: clean-architecture-cqrs
description: >-
  Architectural guidelines and boundaries for Modular Monolith, Clean Architecture,
  Domain-Driven Design (DDD), and CQRS in NestJS. Use this skill when designing, creating,
  or refactoring modules, domain entities, use-cases (commands/queries/events), repositories,
  and inter-module communications.
---

# Clean Architecture, DDD & CQRS Guidelines

Kiến trúc chuẩn của dự án: **Modular Monolith + Clean Architecture + Domain-Driven Design (DDD) + CQRS** trên nền tảng **NestJS + TypeORM + PostgreSQL**.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

1. **Mỗi file 1 mục đích duy nhất (One Class/Interface per File)**:
   - Tuyệt đối không khai báo nhiều class, nhiều interface hoặc gom nhiều DTO vào chung 1 file.
2. **Quy tắc ranh giới một chiều (Dependency Rule)**:
   - `Presentation` ➡️ phụ thuộc vào `Use Case` (CQRS Buses/DTOs).
   - `Use Case` ➡️ phụ thuộc vào `Domain`.
   - `Domain` ➡️ **TRÁI TIM HỆ THỐNG**: Độc lập tuyệt đối, không phụ thuộc vào bất kỳ framework, ORM hay thư viện bên ngoài nào (No NestJS decorators, No TypeORM).
   - `Infra` ➡️ triển khai (implements) các interface của `Domain` và `Use Case`.
3. **Cấm Tight-Coupling giữa các Module**:
   - Một module **tuyệt đối không được import trực tiếp Database Entity** (`*.entity.ts`) hoặc Repository nội bộ của module khác.
   - Để tác động hoặc dọn dẹp dữ liệu sang module khác khi có hành vi xảy ra (Ví dụ: User bị lock/delete ➡️ Revoke Refresh Token bên Auth), bắt buộc sử dụng **CQRS Domain Events (`IEvent`)**.
4. **Tách biệt Triệt để Write & Read (CQRS)**:
   - Các tác vụ thay đổi dữ liệu (Create, Update, Delete, Lock,...) đi qua **Commands & CommandHandlers**.
   - Các tác vụ truy vấn dữ liệu phức tạp / phân trang đi qua **Queries, QueryHandlers & QueryServices**, trả về DTO/Model đọc tối ưu.
5. **Quy tắc Single Export (1 class chỉ export 1 lần)**:
   - Mỗi file chỉ export class/interface đúng 1 lần duy nhất bằng **Named Export** (`export class ...`).
   - Tuyệt đối không export trùng lặp vừa Named Export vừa Default Export (`export default`).

---

## 2. Cấu Trúc Thư Mục Module Chuẩn

Mọi module nghiệp vụ trong `src/modules/<module-name>/` phải tuân theo cấu trúc phân tầng nghiêm ngặt:

```text
src/modules/<module-name>/
├── <module-name>.di-token.ts        # DI Tokens cho Repository, Service của module
├── <module-name>.module.ts          # Khai báo NestJS Module
│
├── presentation/                    # TẦNG GIAO DIỆN (HTTP Controllers, DTOs, Constants)
│   ├── controllers/                 # *.controller.ts (Xử lý HTTP Request/Response)
│   ├── request/                     # *.request.dto.ts (Validate Input từ Client)
│   ├── response/                    # *.response.dto.ts (Định dạng dữ liệu Output)
│   └── constants/                   # *.constant.ts (Response Codes, Sort Field whitelist,...)
│
├── use-case/                        # TẦNG NGHIỆP VỤ ỨNG DỤNG (CQRS Application Layer)
│   ├── commands/                    # Ghi dữ liệu (Write Model)
│   │   ├── implements/              # *.command.ts (Khai báo Command Payload)
│   │   └── handlers/                # *.command.handler.ts (Xử lý thực thi Command)
│   ├── queries/                     # Đọc dữ liệu (Read Model)
│   │   ├── implements/              # *.query.ts (Khai báo Query Payload)
│   │   ├── handlers/                # *.query.handler.ts (Xử lý thực thi Query)
│   │   ├── services/                # *.query.service.interface.ts & service implementation
│   │   └── models/                  # *.model.ts (Read models / Filter models tối ưu)
│   ├── events/                      # Sự kiện nội bộ phát sinh sau khi Command thành công
│   │   ├── implements/              # *.event.ts (Khai báo Event Payload)
│   │   └── handlers/                # *.event-handler.ts (Lắng nghe và phản ứng event)
│   └── results/                     # Kết quả trả về đặc thù từ use-case (nếu có)
│
├── domain/                          # TẦNG NGHIỆP VỤ CỐT LÕI (Domain Layer - Pure TS)
│   ├── entities/                    # *.ts (Domain Entity thuần túy, chứa nghiệp vụ)
│   ├── value-objects/               # *.vo.ts (Value Objects bất biến)
│   ├── enums/                       # *.enum.ts (Enum định nghĩa trạng thái, role,...)
│   ├── exceptions/                  # *.exception.ts (Domain Exceptions kế thừa BaseException)
│   └── repositories/                # *.repository.interface.ts (Port lưu trữ - chỉ interface)
│
└── infra/                           # TẦNG HẠ TẦNG (Infrastructure Layer)
    ├── persistence/                 # TypeORM Entity & Repository Adapter
    │   ├── *.entity.ts              # TypeORM DB Entity (Map với table trong Database)
    │   └── *.repository.ts          # Triển khai IUserRepository thao tác Database
    ├── mappers/                     # *.mapper.ts (Chuyển đổi qua lại giữa Domain & DB Entity)
    └── services/                    # Triển khai service hạ tầng (Token, Hashing,...)
```

---

## 3. Trách Nhiệm Từng Tầng (Layer Responsibilities)

### 3.1. Presentation Layer (`presentation/`)
- **Controller**:
  - Chỉ làm nhiệm vụ tiếp nhận HTTP request, giải mã Route Param/Query/Body, và dispatch sang CQRS Bus (`commandBus.execute()` hoặc `queryBus.execute()`).
  - **CẤM**: Chứa logic nghiệp vụ, query database, hoặc gọi trực tiếp Repository tại Controller.
  - **Bắt buộc**: Dùng `ParseUUIDPipe` cho mọi route parameter là ID:
    ```typescript
    @Get(':userId')
    async getUserDetail(@Param('userId', ParseUUIDPipe) userId: Uuid) {
      return this.queryBus.execute(new UserGetDetailAdminQuery(userId));
    }
    ```
- **DTOs**:
  - Request DTO phải có validation chặt chẽ bằng `class-validator` + Swagger decorators (`@ApiProperty`).
  - Response DTO chỉ trả về các trường được phép public, không bao giờ expose password hash, salt, hoặc token bí mật.

### 3.2. Use Case Layer (`use-case/`)
- **Command Handlers**:
  - Xử lý các quy tắc nghiệp vụ ứng dụng cho luồng ghi (Write flow).
  - Tương tác với Domain Repository thông qua Interface (`IUserRepository`) được inject bằng DI Token (`@Inject(USERS_DI_TOKEN.REPOSITORY)`).
  - Kích hoạt side-effects bằng cách bắn event: `this.eventBus.publish(new UserLockedEvent(user.id))`.
- **Query Handlers & Query Services**:
  - Xử lý các luồng đọc dữ liệu (Read flow).
  - Trả về DTO hoặc Read Model trực tiếp, không ép buộc map qua Domain Entity nếu không cần thiết nhằm tối ưu hiệu năng.
- **Event Handlers**:
  - Lắng nghe các sự kiện xảy ra từ các module khác để xử lý tác vụ tương ứng (Side-effects).

### 3.3. Domain Layer (`domain/`)
- **Domain Entity**:
  - Thể hiện thực thể nghiệp vụ cốt lõi, bảo toàn tính toàn vẹn (Invariants) của dữ liệu.
  - Không chứa metadata ORM (`@Column`, `@Entity`).
- **Repository Interface**:
  - Chỉ định nghĩa hợp đồng lưu trữ (Ports), độc lập với TypeORM:
    ```typescript
    export interface IUserRepository {
      findById(id: Uuid): Promise<User | null>;
      save(user: User): Promise<void>;
      delete(id: Uuid): Promise<void>;
    }
    ```
- **Domain Exceptions**:
  - Kế thừa từ `BaseException`. Không ném trực tiếp `HttpException`, `BadRequestException` ở tầng Domain.

### 3.4. Infrastructure Layer (`infra/`)
- **Persistence (`infra/persistence/`)**:
  - TypeORM Entity (`*.entity.ts`): Ánh xạ 1-1 với cấu trúc bảng trong PostgreSQL.
  - Repository Implementation (`*.repository.ts`): Triển khai Interface từ domain, thực hiện các câu query TypeORM cụ thể.
- **Mapper (`infra/mappers/`)**:
  - Chuyển đổi hai chiều:
    - `toDomain(raw: UserEntity): User`
    - `toPersistence(domain: User): UserEntity`

---

## 4. Giao Tiếp Giữa Các Module (Inter-Module Communication via CQRS Events)

1. **KHÔNG import Entity/Repository của module khác**:
   - ❌ **Sai**: `UserRepository` import `RefreshTokenEntity` để xóa token khi lock user.
   - ✅ **Đúng**: Bắn Event từ Command Handler và để module kia tự lắng nghe.
2. **Luồng Event-Driven mẫu**:
   ```mermaid
   flowchart LR
       A["UserAdminController"] -->|"execute(UserLockCommand)"| B["UserLockCommandHandler"]
       B -->|"userRepository.save(lockedUser)"| C[("users table")]
       B -->|"eventBus.publish(new UserLockedEvent(id))"| D["CQRS EventBus"]
       D -->|"Lắng nghe UserLockedEvent"| E["RevokeTokensOnUserLockedEventHandler\n(Module Auth)"]
       E -->|"authRepository.revokeActiveRefreshTokensByUserId(id)"| F[("refresh_tokens table")]
   ```

