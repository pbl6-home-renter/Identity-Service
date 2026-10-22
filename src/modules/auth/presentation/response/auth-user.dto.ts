import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { User } from '../../../users/domain/entities/user';

export class AuthUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: Uuid;

  @ApiProperty({ example: 'Lê Văn An' })
  name: string;

  @ApiProperty({ example: 'lan@example.com' })
  email: string;

  @ApiProperty({ example: '0901234567' })
  phone: string;

  @ApiProperty({ example: 'tenant' })
  role: string;

  static fromDomain(user: User): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email.value;
    dto.phone = user.phone.value;
    dto.role = user.role;
    return dto;
  }
}
