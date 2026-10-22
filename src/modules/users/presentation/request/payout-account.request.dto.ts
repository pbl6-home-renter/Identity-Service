import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account.vo';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';

export class PayoutAccountRequestDto {
  @ApiProperty({ example: '970422', minLength: 4, maxLength: 20 })
  @IsRequired(UserValidationMessageConstant.BANK_CODE.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.BANK_CODE.MUST_BE_STRING,
  })
  @IsNotEmpty({ message: UserValidationMessageConstant.BANK_CODE.NOT_EMPTY })
  @Length(4, 20, {
    message: UserValidationMessageConstant.BANK_CODE.INVALID_LENGTH,
  })
  bankCode: string;

  @ApiProperty({ example: '9876543210', pattern: '^[0-9]{6,20}$' })
  @IsRequired(UserValidationMessageConstant.ACCOUNT_NUMBER.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.ACCOUNT_NUMBER.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.ACCOUNT_NUMBER.NOT_EMPTY,
  })
  @Matches(/^[0-9]{6,20}$/, {
    message: UserValidationMessageConstant.ACCOUNT_NUMBER.INVALID_LENGTH,
  })
  accountNumber: string;

  @ApiProperty({ example: 'LE VAN AN', minLength: 1, maxLength: 254 })
  @IsRequired(UserValidationMessageConstant.ACCOUNT_NAME.REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.ACCOUNT_NAME.MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.ACCOUNT_NAME.NOT_EMPTY,
  })
  @Length(1, 254, {
    message: UserValidationMessageConstant.ACCOUNT_NAME.INVALID_LENGTH,
  })
  accountName: string;

  toDomain(): PayoutAccount {
    return PayoutAccount.create({
      bankCode: this.bankCode,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
    });
  }
}
