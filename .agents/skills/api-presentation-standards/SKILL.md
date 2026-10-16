---
name: api-presentation-standards
description: >-
  Standards for HTTP Controllers, DTO validation, Strong Typing (Uuid, ParseUUIDPipe),
  Response Codes, and Swagger/OpenAPI documentation in NestJS. Use this skill when creating
  or modifying API endpoints, controllers, request/response DTOs, or documenting APIs with Swagger.
---

# API Presentation Standards (Controller, DTO & Swagger)

Tầng Presentation là cửa ngõ giao tiếp giữa Client và Hệ thống. Mọi API endpoint phải tuân thủ nghiêm ngặt các quy chuẩn dưới đây.

---

## 1. Trách Nhiệm Của Controller

- **Chỉ dispatch sang CQRS Bus**: Controller chỉ làm nhiệm vụ tiếp nhận HTTP request, parse Route Param / Query / Body, và gửi sang CQRS Bus (`commandBus.execute()` hoặc `queryBus.execute()`).
- **CẤM tuyệt đối**:
  - Không chứa logic tính toán nghiệp vụ trong Controller.
  - Không query database hoặc gọi trực tiếp Repository tại Controller.
  - Không ép kiểu thủ công `userId as Uuid` (phải dùng `ParseUUIDPipe`).

---

## 2. Định Danh Kiểu Mạnh `Uuid` & Validation

- Mọi định danh (userId, profileId, token,...) trong hệ thống phải dùng Value Object `Uuid` (`import { Uuid } from 'shared/domain/value-objects/uuid.vo'`).
- Không dùng kiểu `string` sơ sài cho các trường ID.
- Tại Controller, bắt buộc sử dụng `ParseUUIDPipe` ở parameter:
  ```typescript
  @Get(':userId')
  async getUserDetail(
    @Param('userId', ParseUUIDPipe) userId: Uuid,
  ): Promise<UserDetailResponseDto> {
    return this.queryBus.execute(new UserGetDetailAdminQuery(userId));
  }
  ```
- **Tầng Repository không lặp lại validate cú pháp**: Repository là tầng lưu trữ, tin tưởng dữ liệu đầu vào đã được ranh giới ngoài (`ParseUUIDPipe`, `JwtStrategy`) kiểm định. Không viết lại `if (!isValidUuid(id)) return null;`.

---

## 3. Request & Response DTOs

### Request DTOs
- Bắt buộc dùng `class-validator` kết hợp với `@ApiProperty` / `@ApiPropertyOptional`.
- Mỗi trường dữ liệu phải có mô tả và ràng buộc rõ ràng (`@IsNotEmpty()`, `@IsEmail()`, `@IsEnum()`, `@MinLength()`,...).

### Response DTOs
- Chỉ expose các trường được phép công khai đến Client.
- Tuyệt đối không trả về `password`, `salt`, secret key hoặc metadata nội bộ không cần thiết.

---

## 4. Mã Phản Hồi Thành Công (`@ResponseCode`)

- Mọi phản hồi thành công trả về client đều phải gắn mã code định danh rõ nghĩa theo định dạng `ACTION_RESOURCE_STATUS` thông qua decorator `@ResponseCode(...)`.
- Định nghĩa tập trung tại `*.constant.ts` của module tương ứng:

```typescript
export class UserResponseCodeConstant {
  static readonly USER_LIST_FETCHED = 'USER_LIST_FETCHED';
  static readonly USER_DETAIL_FETCHED = 'USER_DETAIL_FETCHED';
  static readonly CURRENT_USER_PROFILE_FETCHED = 'CURRENT_USER_PROFILE_FETCHED';
  static readonly USER_ACCOUNT_LOCKED = 'USER_ACCOUNT_LOCKED';
  static readonly USER_ACCOUNT_UNLOCKED = 'USER_ACCOUNT_UNLOCKED';
}
```

Áp dụng trong Controller:
```typescript
@Patch(':userId/lock')
@ResponseCode(UserResponseCodeConstant.USER_ACCOUNT_LOCKED)
async lockUser(
  @Param('userId', ParseUUIDPipe) userId: Uuid,
  @Body() dto: UserLockRequestDto,
): Promise<UserLockResponseDto> {
  return this.commandBus.execute(new UserLockCommand(userId, dto.reason));
}
```

---

## 5. Chuẩn Hóa Swagger / OpenAPI Documentation

Mọi endpoint trong Controller bắt buộc phải có đầy đủ các decorator sau:

```typescript
@Get(':userId')
@HttpCode(HttpStatus.OK)
@ResponseCode(UserResponseCodeConstant.USER_DETAIL_FETCHED)
@ApiOperation({
  operationId: 'getUserDetailAdmin',
  summary: 'Lấy thông tin chi tiết người dùng',
  description: 'Dành riêng cho Quản trị viên truy xuất chi tiết tài khoản',
})
@ApiSuccessResponse({
  status: HttpStatus.OK,
  code: UserResponseCodeConstant.USER_DETAIL_FETCHED,
  dataDto: UserDetailResponseDto,
})
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'INVALID_UUID' })
@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'FORBIDDEN' })
@ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'USER_NOT_FOUND' })
async getUserDetail(
  @Param('userId', ParseUUIDPipe) userId: Uuid,
): Promise<UserDetailResponseDto> {
  return this.queryBus.execute(new UserGetDetailAdminQuery(userId));
}
```

