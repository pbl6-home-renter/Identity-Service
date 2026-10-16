import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';

export class ResetPasswordRequestDto {
  @ApiProperty({
    example: 'sR7pQx9Nm2Vk4...',
    minLength: 1,
    writeOnly: true,
    description: 'Opaque, single-use password reset token',
  })
  @IsRequired('TOKEN_REQUIRED')
  @IsString({ message: 'INVALID_TOKEN' })
  @IsNotEmpty({ message: 'INVALID_TOKEN' })
  @Matches(/\S/, { message: 'INVALID_TOKEN' })
  token: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    minLength: 8,
    maxLength: 255,
    writeOnly: true,
    description:
      'At least 8 characters with uppercase, lowercase and numeric characters',
  })
  @IsRequired('NEW_PASSWORD_REQUIRED')
  @IsString({ message: 'INVALID_NEW_PASSWORD' })
  @IsNotEmpty({ message: 'INVALID_NEW_PASSWORD' })
  @Length(8, 255, { message: 'INVALID_NEW_PASSWORD' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'INVALID_NEW_PASSWORD',
  })
  newPassword: string;
}
