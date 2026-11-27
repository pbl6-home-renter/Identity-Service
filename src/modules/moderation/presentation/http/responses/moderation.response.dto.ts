import { ApiProperty } from '@nestjs/swagger';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { AppealCurrentResult } from '../../../application/queries/appeal-get-current/appeal-get-current.query.handler';
import {
  AppealDetailModel,
  AppealListItemModel,
  ModerationUserSummary,
} from '../../../application/queries/models/appeal.model';
import {
  ReportDetailModel,
  ReportListItemModel,
} from '../../../application/queries/models/report.model';
import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { UserReport } from '../../../domain/entities/user-report';
import { AccountAppealStatus } from '../../../domain/enums/account-appeal-status.enum';
import { UserReportContextType } from '../../../domain/enums/user-report-context-type.enum';
import { UserReportStatus } from '../../../domain/enums/user-report-status.enum';
import { ViolationCategory } from '../../../domain/enums/violation-category.enum';

export class ModerationUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ enum: UserRole, nullable: true })
  role: UserRole | null;

  @ApiProperty({ enum: UserStatus, nullable: true })
  status: UserStatus | null;

  static from(model: ModerationUserSummary): ModerationUserSummaryDto {
    return Object.assign(new ModerationUserSummaryDto(), model);
  }
}

/** The appellant's own view of an appeal. */
export class AppealResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ enum: AccountAppealStatus })
  status: AccountAppealStatus;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  attachmentMediaIds: Uuid[];

  @ApiProperty({ type: String, nullable: true })
  contactEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  rejectReason: string | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  reviewedAt: Date | null;

  static fromDomain(appeal: AccountAppeal): AppealResponseDto {
    const dto = new AppealResponseDto();
    dto.id = appeal.id;
    dto.status = appeal.status;
    dto.content = appeal.content;
    dto.attachmentMediaIds = appeal.attachmentMediaIds;
    dto.contactEmail = appeal.contactEmail;
    dto.contactPhone = appeal.contactPhone;
    dto.rejectReason = appeal.rejectReason;
    dto.createdAt = appeal.createdAt;
    dto.reviewedAt = appeal.reviewedAt;
    return dto;
  }
}

export class AppealCurrentResponseDto {
  @ApiProperty({ type: String, nullable: true })
  lockReason: string | null;

  @ApiProperty({ type: Date, nullable: true })
  lockedAt: Date | null;

  @ApiProperty({
    type: AppealResponseDto,
    nullable: true,
    description: 'Latest appeal of the current lock period',
  })
  appeal: AppealResponseDto | null;

  @ApiProperty()
  canSubmit: boolean;

  @ApiProperty({
    type: Date,
    nullable: true,
    description: 'Set while a rejected appeal is in its 7-day wait',
  })
  nextSubmitAt: Date | null;

  static fromResult(result: AppealCurrentResult): AppealCurrentResponseDto {
    const dto = new AppealCurrentResponseDto();
    dto.lockReason = result.lockReason;
    dto.lockedAt = result.lockedAt;
    dto.appeal = result.appeal
      ? AppealResponseDto.fromDomain(result.appeal)
      : null;
    dto.canSubmit = result.canSubmit;
    dto.nextSubmitAt = result.nextSubmitAt;
    return dto;
  }
}

export class AppealAdminListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ type: ModerationUserSummaryDto })
  user: ModerationUserSummaryDto;

  @ApiProperty({ type: String, nullable: true })
  lockReason: string | null;

  @ApiProperty({ type: Date })
  lockedAt: Date;

  @ApiProperty()
  content: string;

  @ApiProperty()
  attachmentCount: number;

  @ApiProperty({ enum: AccountAppealStatus })
  status: AccountAppealStatus;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  reviewedAt: Date | null;

  static fromModel(model: AppealListItemModel): AppealAdminListItemResponseDto {
    const dto = new AppealAdminListItemResponseDto();
    dto.id = model.id;
    dto.user = ModerationUserSummaryDto.from(model.user);
    dto.lockReason = model.lockReason;
    dto.lockedAt = model.lockedAt;
    dto.content = model.content;
    dto.attachmentCount = model.attachmentCount;
    dto.status = model.status;
    dto.createdAt = model.createdAt;
    dto.reviewedAt = model.reviewedAt;
    return dto;
  }
}

export class AppealAdminDetailResponseDto extends AppealAdminListItemResponseDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  attachmentMediaIds: Uuid[];

  @ApiProperty({ type: String, nullable: true })
  contactEmail: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  rejectReason: string | null;

  @ApiProperty({ type: ModerationUserSummaryDto, nullable: true })
  reviewedBy: ModerationUserSummaryDto | null;

  static fromDetail(model: AppealDetailModel): AppealAdminDetailResponseDto {
    const dto = Object.assign(
      new AppealAdminDetailResponseDto(),
      AppealAdminListItemResponseDto.fromModel(model),
    );
    dto.attachmentMediaIds = model.attachmentMediaIds;
    dto.contactEmail = model.contactEmail;
    dto.contactPhone = model.contactPhone;
    dto.rejectReason = model.rejectReason;
    dto.reviewedBy = model.reviewedBy
      ? ModerationUserSummaryDto.from(model.reviewedBy)
      : null;
    return dto;
  }
}

export class AppealReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ enum: AccountAppealStatus })
  status: AccountAppealStatus;

  @ApiProperty({ format: 'uuid' })
  userId: Uuid;

  @ApiProperty({
    description:
      'Accept only: false when the account had already been unlocked',
  })
  unlocked: boolean;

  static fromDomain(
    appeal: AccountAppeal,
    unlocked: boolean,
  ): AppealReviewResponseDto {
    const dto = new AppealReviewResponseDto();
    dto.id = appeal.id;
    dto.status = appeal.status;
    dto.userId = appeal.userId;
    dto.unlocked = unlocked;
    return dto;
  }
}

export class ReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ format: 'uuid' })
  reportedUserId: Uuid;

  @ApiProperty({ enum: ViolationCategory })
  category: ViolationCategory;

  @ApiProperty({ enum: UserReportStatus })
  status: UserReportStatus;

  @ApiProperty({ type: Date })
  createdAt: Date;

  static fromDomain(report: UserReport): ReportResponseDto {
    const dto = new ReportResponseDto();
    dto.id = report.id;
    dto.reportedUserId = report.reportedUserId;
    dto.category = report.category;
    dto.status = report.status;
    dto.createdAt = report.createdAt;
    return dto;
  }
}

export class ReportAdminListItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ type: ModerationUserSummaryDto })
  reporter: ModerationUserSummaryDto;

  @ApiProperty({ type: ModerationUserSummaryDto })
  reportedUser: ModerationUserSummaryDto;

  @ApiProperty({ enum: ViolationCategory })
  category: ViolationCategory;

  @ApiProperty()
  description: string;

  @ApiProperty()
  evidenceCount: number;

  @ApiProperty({ enum: UserReportStatus })
  status: UserReportStatus;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  resolvedAt: Date | null;

  static fromModel(model: ReportListItemModel): ReportAdminListItemResponseDto {
    const dto = new ReportAdminListItemResponseDto();
    dto.id = model.id;
    dto.reporter = ModerationUserSummaryDto.from(model.reporter);
    dto.reportedUser = ModerationUserSummaryDto.from(model.reportedUser);
    dto.category = model.category;
    dto.description = model.description;
    dto.evidenceCount = model.evidenceCount;
    dto.status = model.status;
    dto.createdAt = model.createdAt;
    dto.resolvedAt = model.resolvedAt;
    return dto;
  }
}

export class ReportAdminDetailResponseDto extends ReportAdminListItemResponseDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  evidenceMediaIds: Uuid[];

  @ApiProperty({ enum: UserReportContextType, nullable: true })
  contextType: UserReportContextType | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  contextId: Uuid | null;

  @ApiProperty({ type: String, nullable: true })
  resolutionNote: string | null;

  @ApiProperty({ type: ModerationUserSummaryDto, nullable: true })
  resolvedBy: ModerationUserSummaryDto | null;

  static fromDetail(model: ReportDetailModel): ReportAdminDetailResponseDto {
    const dto = Object.assign(
      new ReportAdminDetailResponseDto(),
      ReportAdminListItemResponseDto.fromModel(model),
    );
    dto.evidenceMediaIds = model.evidenceMediaIds;
    dto.contextType = model.contextType;
    dto.contextId = model.contextId;
    dto.resolutionNote = model.resolutionNote;
    dto.resolvedBy = model.resolvedBy
      ? ModerationUserSummaryDto.from(model.resolvedBy)
      : null;
    return dto;
  }
}

export class ReportResolveResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: Uuid;

  @ApiProperty({ enum: UserReportStatus })
  status: UserReportStatus;

  @ApiProperty({ format: 'uuid' })
  reportedUserId: Uuid;

  @ApiProperty({ description: 'True when this call locked the account' })
  locked: boolean;

  static fromDomain(
    report: UserReport,
    locked: boolean,
  ): ReportResolveResponseDto {
    const dto = new ReportResolveResponseDto();
    dto.id = report.id;
    dto.status = report.status;
    dto.reportedUserId = report.reportedUserId;
    dto.locked = locked;
    return dto;
  }
}
