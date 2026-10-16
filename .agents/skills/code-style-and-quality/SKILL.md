---
name: code-style-and-quality
description: >-
  Code formatting, 5-group import order, linting rules (Oxlint/Prettier), and pre-PR checklist.
  Use this skill when writing or refactoring code, formatting files, organizing imports,
  or running quality checks before committing and creating a Pull Request.
---

# Code Style, Import Order & Quality Checklist

---

## 1. Quy Chuẩn Định Dạng (Formatting)

- Dự án tuân thủ cấu hình trong `.prettierrc`:
  - `singleQuote: true` (Luôn dùng nháy đơn).
  - `trailingComma: 'all'` (Luôn có dấu phẩy ở phần tử cuối cùng).
  - `tabWidth: 2` (Indent 2 spaces).
- Linter: Kiểm tra bằng `npm run lint` (`oxlint src/`). Tuyệt đối không để lại warning hoặc error trước khi commit/push code.
- Format code: `npm run format`.
- **Mỗi file 1 mục đích duy nhất**: Không gom nhiều class/interface/DTO vào 1 file.
- **Quy tắc Single Export (1 class chỉ export 1 lần)**:
  - Chỉ export class/interface đúng 1 lần duy nhất bằng **Named Export**: `export class AdminSeeder { ... }`.
  - **CẤM**: Tuyệt đối không export trùng lặp vừa Named Export vừa Default Export (ví dụ: `export class AdminSeeder` kèm `export default AdminSeeder;` ở cuối file).
  - Thống nhất toàn bộ dự án sử dụng **Named Export** để IDE auto-import chính xác và refactor an toàn.

---

## 2. Thứ Tự Sắp Xếp Imports (5-Group Import Order)

Các file code bắt buộc gom nhóm và sắp xếp import theo đúng 5 nhóm sau (mỗi nhóm cách nhau 1 dòng trống):

```typescript
// Nhóm 1: Framework & Thư viện bên ngoài (Third-party)
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';

// Nhóm 2: Shared & Common Kernel (shared/*, utils/*)
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PostgresErrorCode } from 'shared/infra/typeorm/constants/postgres-error-code.constant';
import { BcryptUtils } from 'utils/bcrypt.utils';

// Nhóm 3: Cross-Module Imports (Chỉ import Event, DTO hoặc DI Token công khai của module khác)
import { UserLockedEvent } from 'modules/users/use-case/events/implements/user-locked.event';

// Nhóm 4: Current Module Domain & Use Case
import { User } from '../../domain/entities/user';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USERS_DI_TOKEN } from '../../users.di-token';

// Nhóm 5: Current Module Infrastructure (Mappers, DB Entities)
import { UserMapper } from '../mappers/user.mapper';
import { UserEntity } from './user.entity';
```

---

## 3. Checklist Trước Khi Tạo Pull Request (PR)

Trước khi commit và push code hoặc tạo Pull Request, lập trình viên / AI agent bắt buộc kiểm tra:

- [ ] **Biên dịch**: `npm run build` thành công, không có lỗi TypeScript.
- [ ] **Linter**: `npm run lint` (`oxlint src/`) đạt **0 warnings, 0 errors**.
- [ ] **Formatting**: Chạy `npm run format:check` hoặc `npm run format` qua Prettier.
- [ ] **Single Responsibility**: 1 class/interface trên 1 file.
- [ ] **Single Export**: 1 class chỉ export đúng 1 lần (dùng Named Export, không export trùng lặp với `export default`).
- [ ] **Naming**: Tên file theo `kebab-case.suffix.ts`, tên class theo `PascalCase` tuân thủ pattern `Domain - Action`.
- [ ] **Loose Coupling**: Không import trực tiếp Database Entity hoặc Repository nội bộ của module khác (dùng CQRS Event nếu cần đồng bộ dữ liệu).
- [ ] **Strong Typing**: Tất cả các route param ID đều dùng `ParseUUIDPipe` và strong type `Uuid`.
- [ ] **Swagger & Response Codes**: Endpoint có đầy đủ Swagger decorator (`@ApiOperation`, `@ApiSuccessResponse`, `@ApiResponse`) và `@ResponseCode`.
- [ ] **Import Order**: Imports được gom nhóm và sắp xếp theo đúng 5 nhóm quy định.

