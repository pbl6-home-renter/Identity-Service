import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../../domain/entities/user';

export class UserLookupInternalResponseDto {
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

  @ApiProperty({ enum: UserRole, example: UserRole.LANDLORD })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://media.example.com/avatars/user.jpg',
    description: 'URL công khai của avatar; null nếu user chưa có avatar.',
  })
  avatarUrl: string | null;

  static fromDomain(
    user: User,
    avatarUrl: string | null,
  ): UserLookupInternalResponseDto {
    const dto = new UserLookupInternalResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email.value;
    dto.phone = user.phone.value;
    dto.role = user.role;
    dto.status = user.status;
    dto.isDeleted = user.isDeleted;
    dto.avatarUrl = avatarUrl;
    return dto;
  }
}
