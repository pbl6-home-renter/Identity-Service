import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';

export class UserListAdminResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: Uuid;

  @ApiProperty({ example: 'Lê Văn An' })
  name: string;

  @ApiProperty({ example: 'lan@example.com' })
  email: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TENANT })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  static fromDomain(user: User): UserListAdminResponseDto {
    const dto = new UserListAdminResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.status = user.status;
    return dto;
  }
}
