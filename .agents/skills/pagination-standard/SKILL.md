---
name: pagination-standard
description: >-
  Standardized offset pagination guidelines for NestJS APIs and TypeORM queries.
  Use this skill when implementing paginated list endpoints, query request DTOs,
  sort whitelists, or returning PaginatedResponseDto.
---

# Chuẩn Phân Trang (Pagination Standard)

Dự án áp dụng chuẩn phân trang theo cơ chế Offset Pagination thống nhất trên toàn hệ thống.

---

## 1. Request Phân Trang (`OffsetPaginationQueryRequestDto`)

Mọi query DTO có phân trang bắt buộc kế thừa từ `OffsetPaginationQueryRequestDto`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { OffsetPaginationQueryRequestDto } from 'shared/presentation/pagination/offset-pagination.request.dto';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';

export const USER_SORT_FIELDS = ['createdAt', 'email', 'name'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class UserListAdminQueryRequestDto extends OffsetPaginationQueryRequestDto {
  // 1. Chỉ override sort nếu cần whitelist theo resource
  @ApiPropertyOptional({ enum: USER_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(USER_SORT_FIELDS)
  override sort?: UserSortField = 'createdAt';

  // 2. Khai báo các trường lọc trực tiếp (flat query params) để Swagger UI và Client thuận tiện sử dụng:
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  q?: string;
}
```

### Các quy định quan trọng:
1. **Không tự ý override lại `pageNo`, `pageSize` hay `order`**:
   - `pageNo`: Số nguyên dương >= 1 (mặc định: `1`).
   - `pageSize`: Số nguyên dương từ 1 đến 100 (mặc định: `20`).
   - `order`: `'asc' | 'desc'` (mặc định: `'desc'`).
2. **Khai báo bộ lọc phẳng (flat query params)**: Tránh lồng object phức tạp trong query param.

---

## 2. Response Phân Trang (`PaginatedResponseDto<T>`)

API danh sách phân trang bắt buộc trả về cấu trúc `PaginatedResponseDto<T>`:

```typescript
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "2026-10-16T12:00:00.000Z"
    }
  ],
  "pagination": {
    "pageNo": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

## 3. Swagger Decorator Cho API Phân Trang

Tại Controller:

```typescript
@Get()
@HttpCode(HttpStatus.OK)
@ResponseCode(UserResponseCodeConstant.USER_LIST_FETCHED)
@ApiOperation({
  operationId: 'listUsersAdmin',
  summary: 'Lấy danh sách người dùng có phân trang',
  description: 'Dành riêng cho Quản trị viên lọc và tìm kiếm danh sách người dùng',
})
@ApiSuccessResponse({
  status: HttpStatus.OK,
  code: UserResponseCodeConstant.USER_LIST_FETCHED,
  dataDto: UserListAdminResponseDto,
  isPagination: true,
})
async listUsers(
  @Query() query: UserListAdminQueryRequestDto,
): Promise<PaginatedResponseDto<UserListAdminResponseDto>> {
  return this.queryBus.execute(new UserListAdminQuery(query));
}
```

