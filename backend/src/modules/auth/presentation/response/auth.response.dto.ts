import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/domain/entities/user';

export class AuthUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

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
    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    return dto;
  }
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token with 15-minute expiration',
  })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  static create(accessToken: string, user: User): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = accessToken;
    dto.user = AuthUserDto.fromDomain(user);
    return dto;
  }
}
