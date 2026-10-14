import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { IsRequired } from 'shared/decorators/is-required.decorator';

export class RequestPasswordResetRequestDto {
  @ApiProperty({
    example: 'lan@example.com',
    minLength: 5,
    maxLength: 254,
    description: 'Email address of the account to reset',
  })
  @IsRequired('EMAIL_REQUIRED')
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'EMAIL_MUST_BE_STRING' })
  @Length(5, 254, { message: 'EMAIL_INVALID_LENGTH' })
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'EMAIL_INVALID_FORMAT',
  })
  @IsEmail({}, { message: 'EMAIL_INVALID_FORMAT' })
  email: string;
}
