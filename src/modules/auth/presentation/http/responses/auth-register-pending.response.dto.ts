import { ApiProperty } from '@nestjs/swagger';
import { User } from 'modules/users/domain/entities/user';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';

export class AuthRegisterPendingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ enum: [UserRole.TENANT, UserRole.LANDLORD] })
  role: UserRole;

  @ApiProperty({ enum: ['pending_verification'] })
  status: 'pending_verification';

  @ApiProperty({ enum: [true] })
  verificationRequired: true;

  static fromUser(user: User): AuthRegisterPendingResponseDto {
    const dto = new AuthRegisterPendingResponseDto();
    dto.id = user.id;
    dto.email = user.email.value;
    dto.role = user.role;
    dto.status = 'pending_verification';
    dto.verificationRequired = true;
    return dto;
  }
}
