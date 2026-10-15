import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';
import { IsPhoneNumber } from 'shared/decorators/is-phone-number.decorator';

export class UserUpdateAdminRequestDto {
  static readonly unexpectedFieldCode = 'VALIDATION_FAILED';

  @ApiPropertyOptional({
    example: 'Nguyễn Văn An',
    minLength: 1,
    maxLength: 254,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.NAME.MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.NAME.NOT_EMPTY })
  @Matches(/\S/, { message: UserValidationMessageConstant.NAME.NOT_EMPTY })
  @Length(1, 254, {
    message: UserValidationMessageConstant.NAME.INVALID_LENGTH,
  })
  name?: string;

  @ApiPropertyOptional({
    example: '0901234567',
    minLength: 10,
    maxLength: 12,
    pattern: '^(0[0-9]{9}|\\+84[0-9]{9})$',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.PHONE.MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.PHONE.NOT_EMPTY })
  @IsPhoneNumber(UserValidationMessageConstant.PHONE.INVALID_FORMAT)
  phone?: string;
}
