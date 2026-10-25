import { UserUpdateMeInput } from '../../../application/commands/user-update-me/user-update-me.command';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  Length,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { IsPhoneNumber } from '../validators/is-phone-number.decorator';
import { PayoutAccountRequestDto } from './payout-account.request.dto';

export class UserUpdateMeRequestDto implements UserUpdateMeInput {
  static readonly unexpectedFieldCode = 'VALIDATION_FAILED';

  @ApiProperty({
    example: 'Lê Văn An Mới',
    minLength: 1,
    maxLength: 254,
  })
  @IsRequired(UserValidationMessageConstant.NAME.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.NAME.MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.NAME.NOT_EMPTY })
  @Matches(/\S/, { message: UserValidationMessageConstant.NAME.NOT_EMPTY })
  @Length(1, 254, {
    message: UserValidationMessageConstant.NAME.INVALID_LENGTH,
  })
  name: string;

  @ApiProperty({
    example: '0909999888',
    minLength: 10,
    maxLength: 12,
    pattern: '^0[0-9]{9}$|^\\+84[0-9]{9}$',
  })
  @IsRequired(UserValidationMessageConstant.PHONE.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.PHONE.MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.PHONE.NOT_EMPTY })
  @IsPhoneNumber(UserValidationMessageConstant.PHONE.INVALID_FORMAT)
  phone: string;

  @ApiProperty({ type: PayoutAccountRequestDto, nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsRequired(UserValidationMessageConstant.PAYOUT_ACCOUNT.MUST_BE_OBJECT)
  @IsObject({
    message: UserValidationMessageConstant.PAYOUT_ACCOUNT.MUST_BE_OBJECT,
  })
  @ValidateNested()
  @Type(() => PayoutAccountRequestDto)
  payoutAccount: PayoutAccountRequestDto | null;
}
