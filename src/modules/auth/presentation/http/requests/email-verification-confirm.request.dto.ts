import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { EmailVerificationConfirmInput } from '../../../application/commands/email-verification-confirm/email-verification-confirm.command';
import { EmailVerificationConfirmCommand } from '../../../application/commands/email-verification-confirm/email-verification-confirm.command';
import { IsRequired } from 'shared/presentation/validators/is-required.decorator';
import { AuthValidationMessageConstant } from '../constants/auth-validation-message.constant';

export class EmailVerificationConfirmRequestDto implements EmailVerificationConfirmInput {
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsRequired(AuthValidationMessageConstant.EMAIL_VERIFICATION_TOKEN_REQUIRED)
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  token: string;

  static toCommand(
    request: EmailVerificationConfirmRequestDto,
  ): EmailVerificationConfirmCommand {
    return EmailVerificationConfirmCommand.create(request);
  }
}
