---
name: domain-action-naming
description: >-
  Strict naming conventions using the Domain-Action pattern for files, classes, interfaces,
  enums, exceptions, and DI tokens. Use this skill whenever creating new files, classes,
  DTOs, commands, queries, events, exceptions, or refactoring existing names.
---

# Quy Chuẩn Đặt Tên: Domain - Action Pattern

Toàn bộ dự án áp dụng nghiêm ngặt quy tắc đặt tên theo mô hình **`Domain - Action`** (Tên miền nghiệp vụ đứng trước, Hành vi/Mục tiêu đứng sau).

## 1. Công Thức Tổng Quát

| Đối tượng | Quy tắc định dạng | Cú pháp chuẩn |
| :--- | :--- | :--- |
| **Tên File** | `kebab-case` | `[domain]-[action].[type].ts` |
| **Tên Class** | `PascalCase` | `[Domain][Action][Type]` |
| **Tên Exception** | `kebab-case` & `PascalCase` | `[domain]-[action]-[reason].exception.ts` ➡️ `[Domain][Action][Reason]Exception` |

> 📌 **Quy tắc vàng**: Tên miền (`domain`) luôn đặt ở đầu, theo sau là hành động (`action`) hoặc đối tượng hành động, và kết thúc bằng vai trò/hậu tố (`type`).

---

## 2. Bảng Quy Chuẩn Chi Tiết Theo Từng Thành Phần

### A. Commands & Command Handlers (Tác vụ Ghi)
- **File**: `<domain>-<action>.command.ts` & `<domain>-<action>.command.handler.ts`
- **Class**: `<Domain><Action>Command` & `<Domain><Action>CommandHandler`

| Tên File | Tên Class | Diễn giải |
| :--- | :--- | :--- |
| `user-lock.command.ts` | `UserLockCommand` | Lệnh khóa tài khoản người dùng |
| `user-lock.command.handler.ts` | `UserLockCommandHandler` | Handler xử lý lệnh khóa tài khoản |
| `user-unlock.command.ts` | `UserUnlockCommand` | Lệnh mở khóa tài khoản |
| `user-delete.command.ts` | `UserDeleteCommand` | Lệnh xóa người dùng |
| `user-change-password.command.ts` | `UserChangePasswordCommand` | Lệnh đổi mật khẩu |
| `user-update-me.command.ts` | `UserUpdateMeCommand` | Lệnh cập nhật profile cá nhân |
| `user-update-admin.command.ts` | `UserUpdateAdminCommand` | Lệnh admin cập nhật user |
| `auth-login.command.ts` | `AuthLoginCommand` | Lệnh đăng nhập xác thực |
| `auth-register.command.ts` | `AuthRegisterCommand` | Lệnh đăng ký tài khoản |
| `request-password-reset.command.ts` | `RequestPasswordResetCommand` | Lệnh yêu cầu reset mật khẩu |

---

### B. Queries & Query Handlers (Tác vụ Đọc)
- **File**: `<domain>-<action>.query.ts` & `<domain>-<action>.query.handler.ts`
- **Class**: `<Domain><Action>Query` & `<Domain><Action>QueryHandler`

| Tên File | Tên Class | Diễn giải |
| :--- | :--- | :--- |
| `user-get-me.query.ts` | `UserGetMeQuery` | Truy vấn thông tin tài khoản hiện tại |
| `user-get-me.query.handler.ts` | `UserGetMeQueryHandler` | Handler lấy thông tin cá nhân |
| `user-get-detail-admin.query.ts` | `UserGetDetailAdminQuery` | Truy vấn chi tiết user cho admin |
| `user-list-admin.query.ts` | `UserListAdminQuery` | Truy vấn danh sách user có phân trang |

---

### C. Request & Response DTOs (Tầng Presentation)
- **File**: `<domain>-<action>.request.dto.ts` & `<domain>-<action>.response.dto.ts`
- **Class**: `<Domain><Action>RequestDto` & `<Domain><Action>ResponseDto`

| Tên File | Tên Class | Diễn giải |
| :--- | :--- | :--- |
| `auth-login.request.dto.ts` | `AuthLoginRequestDto` | Payload body khi đăng nhập |
| `auth-register.request.dto.ts` | `AuthRegisterRequestDto` | Payload body khi đăng ký |
| `user-lock.request.dto.ts` | `UserLockRequestDto` | Body yêu cầu khóa user (lý do lock) |
| `user-change-password.request.dto.ts` | `UserChangePasswordRequestDto` | Body đổi mật khẩu |
| `user-update-me.request.dto.ts` | `UserUpdateMeRequestDto` | Body cập nhật thông tin cá nhân |
| `user-update-admin.request.dto.ts` | `UserUpdateAdminRequestDto` | Body admin cập nhật user |
| `user-list-admin.query.request.dto.ts` | `UserListAdminQueryRequestDto` | Query params phân trang admin |
| `user-get-me.response.dto.ts` | `UserGetMeResponseDto` | Response trả về profile cá nhân |
| `user-get-detail-admin.response.dto.ts` | `UserGetDetailAdminResponseDto` | Response chi tiết user cho admin |
| `user-list-admin.response.dto.ts` | `UserListAdminResponseDto` | Response item danh sách user |
| `user-lock.response.dto.ts` | `UserLockResponseDto` | Response trả về sau khi khóa user |

---

### D. CQRS Events & Event Handlers
- **File Event**: `<domain>-<action-past-tense>.event.ts`
- **Class Event**: `<Domain><ActionPastTense>Event`
- **Handler**: `<domain>-<reaction>-on-<event>.event-handler.ts` (hoặc theo mục tiêu hành động của handler)

| Tên File Event / Handler | Tên Class | Diễn giải |
| :--- | :--- | :--- |
| `user-locked.event.ts` | `UserLockedEvent` | Sự kiện user đã bị khóa |
| `user-deleted.event.ts` | `UserDeletedEvent` | Sự kiện user đã bị xóa |
| `user-password-changed.event.ts` | `UserPasswordChangedEvent` | Sự kiện user đã đổi mật khẩu |
| `revoke-tokens-on-user-locked.event-handler.ts` | `RevokeTokensOnUserLockedEventHandler` | Handler thu hồi token khi user bị khóa |
| `revoke-tokens-on-user-deleted.event-handler.ts` | `RevokeTokensOnUserDeletedEventHandler` | Handler thu hồi token khi user bị xóa |
| `soft-delete-profile-on-user-deleted.event-handler.ts` | `SoftDeleteProfileOnUserDeletedEventHandler` | Handler xóa profile khi user bị xóa |

---

### E. Domain Exceptions
- **File**: `<domain>-<action>-<reason>.exception.ts` (hoặc `<domain>-<reason>.exception.ts` nếu là trạng thái chung)
- **Class**: `<Domain><Action><Reason>Exception`

| Tên File | Tên Class | Diễn giải |
| :--- | :--- | :--- |
| `user-not-found.exception.ts` | `UserNotFoundException` | Không tìm thấy người dùng |
| `user-lock-already-locked.exception.ts` | `UserLockAlreadyLockedException` | Tài khoản đã bị khóa từ trước |
| `user-lock-cannot-self.exception.ts` | `UserLockCannotSelfException` | Không được phép tự khóa chính mình |
| `user-unlock-not-locked.exception.ts` | `UserUnlockNotLockedException` | Tài khoản chưa bị khóa nên không thể mở |
| `user-delete-already-deleted.exception.ts` | `UserDeleteAlreadyDeletedException` | Tài khoản đã bị xóa trước đó |
| `user-delete-cannot-self.exception.ts` | `UserDeleteCannotSelfException` | Không được phép tự xóa tài khoản của mình |
| `user-change-password-mismatch.exception.ts` | `UserChangePasswordMismatchException` | Mật khẩu xác nhận không khớp |
| `user-change-password-invalid-current.exception.ts` | `UserChangePasswordInvalidCurrentException` | Mật khẩu hiện tại không đúng |
| `auth-login-account-locked.exception.ts` | `AuthLoginAccountLockedException` | Đăng nhập thất bại do tài khoản bị khóa |
| `auth-login-invalid-credentials.exception.ts` | `AuthLoginInvalidCredentialsException` | Sai thông tin tài khoản hoặc mật khẩu |

---

### F. Entities, Repositories, Mappers & Tokens
- **Domain Entity**: Tên domain đơn giản dưới `domain/entities/`:
  - File: `user.ts` ➡️ Class: `User`
- **TypeORM Entity**: `<domain>.entity.ts` dưới `infra/persistence/`:
  - File: `user.entity.ts` ➡️ Class: `UserEntity`
- **Repository Interface**: `<domain>.repository.interface.ts` dưới `domain/repositories/`:
  - File: `user.repository.interface.ts` ➡️ Interface: `IUserRepository`
- **Repository Implementation**: `<domain>.repository.ts` dưới `infra/persistence/`:
  - File: `user.repository.ts` ➡️ Class: `UserRepository`
- **Mapper**: `<domain>.mapper.ts` dưới `infra/mappers/`:
  - File: `user.mapper.ts` ➡️ Class: `UserMapper`
- **Interface**: PascalCase, luôn có tiền tố `I`:
  - `IUserRepository`, `IAuthRepository`, `IUserQueryService`
- **Enum**: PascalCase, phần tử bên trong là `UPPER_SNAKE_CASE`:
  - `UserRole { ADMIN = 'ADMIN', USER = 'USER' }`
- **DI Tokens**: Object mang tên `[DOMAIN]_DI_TOKEN` viết hoa:
  ```typescript
  export const USERS_DI_TOKEN = {
    REPOSITORY: Symbol('IUserRepository'),
    QUERY_SERVICE: Symbol('IUserQueryService'),
  };
  ```
- **Response Codes**: Class constant `[Domain]ResponseCodeConstant`:
  ```typescript
  export class UserResponseCodeConstant {
    static readonly USER_LIST_FETCHED = 'USER_LIST_FETCHED';
    static readonly USER_DETAIL_FETCHED = 'USER_DETAIL_FETCHED';
  }
  ```

