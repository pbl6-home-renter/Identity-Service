import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { IsRequired } from 'shared/decorators/is-required.decorator';
import { UserValidationMessageConstant } from '../constants/user-validation-message.constant';

export class PayoutAccountRequestDto {
  @ApiPropertyOptional({ example: '970422' })
  @IsRequired(UserValidationMessageConstant.BANK_CODE_REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.BANK_CODE_MUST_BE_STRING,
  })
  @IsNotEmpty({ message: UserValidationMessageConstant.BANK_CODE_NOT_EMPTY })
  @Length(1, 20, {
    message: UserValidationMessageConstant.BANK_CODE_INVALID_LENGTH,
  })
  bankCode: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsRequired(UserValidationMessageConstant.ACCOUNT_NUMBER_REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.ACCOUNT_NUMBER_MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.ACCOUNT_NUMBER_NOT_EMPTY,
  })
  @Length(1, 20, {
    message: UserValidationMessageConstant.ACCOUNT_NUMBER_INVALID_LENGTH,
  })
  accountNumber: string;

  @ApiPropertyOptional({ example: 'LE VAN AN' })
  @IsRequired(UserValidationMessageConstant.ACCOUNT_NAME_REQUIRED)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: UserValidationMessageConstant.ACCOUNT_NAME_MUST_BE_STRING,
  })
  @IsNotEmpty({
    message: UserValidationMessageConstant.ACCOUNT_NAME_NOT_EMPTY,
  })
  @Length(1, 254, {
    message: UserValidationMessageConstant.ACCOUNT_NAME_INVALID_LENGTH,
  })
  accountName: string;

  toDomain(): PayoutAccount {
    return {
      bankCode: this.bankCode,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
    };
  }
}

export class UpdateMeRequestDto {
  @ApiPropertyOptional({
    example: 'Lê Văn An Mới',
    minLength: 1,
    maxLength: 254,
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.NAME_MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.NAME_NOT_EMPTY })
  @Matches(/\S/, { message: UserValidationMessageConstant.NAME_NOT_EMPTY })
  @Length(1, 254, {
    message: UserValidationMessageConstant.NAME_INVALID_LENGTH,
  })
  name?: string;

  @ApiPropertyOptional({ example: '0909999888' })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: UserValidationMessageConstant.PHONE_MUST_BE_STRING })
  @IsNotEmpty({ message: UserValidationMessageConstant.PHONE_NOT_EMPTY })
  @Matches(/^(0[0-9]{9}|\+84[0-9]{9})$/, {
    message: UserValidationMessageConstant.PHONE_INVALID_FORMAT,
  })
  phone?: string;

  @ApiPropertyOptional({ type: PayoutAccountRequestDto })
  @ValidateIf((_object, value) => value !== undefined)
  @IsObject({
    message: UserValidationMessageConstant.PAYOUT_ACCOUNT_MUST_BE_OBJECT,
  })
  @ValidateNested()
  @Type(() => PayoutAccountRequestDto)
  payoutAccount?: PayoutAccountRequestDto;
}
