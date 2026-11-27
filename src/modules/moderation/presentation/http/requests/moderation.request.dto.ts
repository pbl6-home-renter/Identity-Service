import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { AppealSubmitInput } from '../../../application/commands/appeal-submit/appeal-submit.command';
import { ReportResolveInput } from '../../../application/commands/report-resolve/report-resolve.command';
import { ReportSubmitInput } from '../../../application/commands/report-submit/report-submit.command';
import { MODERATION_RULES } from '../../../domain/constants/moderation-rules.constant';
import { AccountAppealStatus } from '../../../domain/enums/account-appeal-status.enum';
import { UserReportContextType } from '../../../domain/enums/user-report-context-type.enum';
import { UserReportResolveAction } from '../../../domain/enums/user-report-resolve-action.enum';
import { UserReportStatus } from '../../../domain/enums/user-report-status.enum';
import { ViolationCategory } from '../../../domain/enums/violation-category.enum';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const emptyToNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class AppealSubmitRequestDto implements AppealSubmitInput {
  @ApiProperty({
    minLength: MODERATION_RULES.APPEAL_CONTENT_MIN_LENGTH,
    maxLength: MODERATION_RULES.APPEAL_CONTENT_MAX_LENGTH,
    example: 'Tôi bị khóa nhầm, tin đăng là phòng thật của tôi.',
  })
  @Transform(trim)
  @IsString()
  @Length(
    MODERATION_RULES.APPEAL_CONTENT_MIN_LENGTH,
    MODERATION_RULES.APPEAL_CONTENT_MAX_LENGTH,
  )
  content: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    maxItems: MODERATION_RULES.APPEAL_MAX_ATTACHMENTS,
    description:
      'Uploaded media of purpose `appeal_attachment` owned by the caller',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MODERATION_RULES.APPEAL_MAX_ATTACHMENTS)
  @IsUUID('all', { each: true })
  attachmentMediaIds?: Uuid[];

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 254 })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_object, value) => value !== null)
  @IsEmail()
  @Length(3, 254)
  contactEmail?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '0901234567',
    description: '8–15 digits, optional leading +',
  })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_object, value) => value !== null)
  @Matches(/^\+?\d{8,15}$/)
  contactPhone?: string | null;
}

export class AppealRejectRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: MODERATION_RULES.APPEAL_REJECT_REASON_MAX_LENGTH,
  })
  @Transform(trim)
  @IsString()
  @Length(1, MODERATION_RULES.APPEAL_REJECT_REASON_MAX_LENGTH)
  rejectReason: string;
}

class PageRequestDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNo: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class AppealListAdminQueryRequestDto extends PageRequestDto {
  @ApiPropertyOptional({ enum: AccountAppealStatus })
  @IsOptional()
  @IsEnum(AccountAppealStatus)
  status?: AccountAppealStatus;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  userId?: Uuid;
}

export class ReportSubmitRequestDto implements ReportSubmitInput {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID('all')
  reportedUserId: Uuid;

  @ApiProperty({ enum: ViolationCategory })
  @IsEnum(ViolationCategory)
  category: ViolationCategory;

  @ApiProperty({
    minLength: MODERATION_RULES.REPORT_DESCRIPTION_MIN_LENGTH,
    maxLength: MODERATION_RULES.REPORT_DESCRIPTION_MAX_LENGTH,
  })
  @Transform(trim)
  @IsString()
  @Length(
    MODERATION_RULES.REPORT_DESCRIPTION_MIN_LENGTH,
    MODERATION_RULES.REPORT_DESCRIPTION_MAX_LENGTH,
  )
  description: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    maxItems: MODERATION_RULES.REPORT_MAX_EVIDENCE,
    description:
      'Uploaded media of purpose `report_evidence` owned by the caller',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MODERATION_RULES.REPORT_MAX_EVIDENCE)
  @IsUUID('all', { each: true })
  evidenceMediaIds?: Uuid[];

  @ApiPropertyOptional({ enum: UserReportContextType, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsEnum(UserReportContextType)
  contextType?: UserReportContextType | null;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsUUID('all')
  contextId?: Uuid | null;
}

export class ReportResolveRequestDto implements ReportResolveInput {
  @ApiProperty({ enum: UserReportResolveAction })
  @IsEnum(UserReportResolveAction)
  action: UserReportResolveAction;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: MODERATION_RULES.RESOLUTION_NOTE_MAX_LENGTH,
  })
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @Length(1, MODERATION_RULES.RESOLUTION_NOTE_MAX_LENGTH)
  note?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    description: 'Required when action is `lock`',
  })
  @Transform(emptyToNull)
  @ValidateIf(
    (object: ReportResolveRequestDto) =>
      object.action === UserReportResolveAction.LOCK,
  )
  @IsString()
  @Length(1, 500)
  lockReason?: string | null;
}

export class ReportListAdminQueryRequestDto extends PageRequestDto {
  @ApiPropertyOptional({ enum: UserReportStatus })
  @IsOptional()
  @IsEnum(UserReportStatus)
  status?: UserReportStatus;

  @ApiPropertyOptional({ enum: ViolationCategory })
  @IsOptional()
  @IsEnum(ViolationCategory)
  category?: ViolationCategory;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID('all')
  reportedUserId?: Uuid;
}
