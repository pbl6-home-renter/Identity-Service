import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { User } from '../../domain/entities/user';

export class UserUpdateAdminResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: Uuid;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  name: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ example: 'an@example.com' })
  email: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  static fromDomain(user: User): UserUpdateAdminResponseDto {
    const dto = new UserUpdateAdminResponseDto();
    dto.userId = user.id;
    dto.name = user.name;
    dto.phone = user.phone.value;
    dto.email = user.email.value;
    dto.status = user.status;
    return dto;
  }
}
