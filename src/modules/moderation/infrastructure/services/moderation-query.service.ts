import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import {
  AppealSearch,
  IModerationQueryService,
  ReportSearch,
} from '../../application/ports/moderation-query-service.port';
import {
  AppealDetailModel,
  AppealListItemModel,
  ModerationUserSummary,
} from '../../application/queries/models/appeal.model';
import {
  ReportDetailModel,
  ReportListItemModel,
} from '../../application/queries/models/report.model';
import { AccountAppealStatus } from '../../domain/enums/account-appeal-status.enum';
import { AccountAppealEntity } from '../persistence/account-appeal.typeorm-entity';
import { UserReportEntity } from '../persistence/user-report.typeorm-entity';

type Raw = Record<string, unknown>;

/** Joins a `users` row as `<alias>` and selects its summary columns. */
function joinUser<T extends object>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  on: string,
): SelectQueryBuilder<T> {
  return qb
    .leftJoin('users', alias, `${alias}.id = ${on}`)
    .addSelect(`${alias}.name`, `${alias}Name`)
    .addSelect(`${alias}.email`, `${alias}Email`)
    .addSelect(`${alias}.role`, `${alias}Role`)
    .addSelect(`${alias}.status`, `${alias}Status`);
}

function userSummary(
  raw: Raw,
  alias: string,
  id: unknown,
): ModerationUserSummary {
  return {
    id: id as Uuid,
    name: (raw[`${alias}Name`] as string | null) ?? null,
    email: (raw[`${alias}Email`] as string | null) ?? null,
    role: (raw[`${alias}Role`] as UserRole | null) ?? null,
    status: (raw[`${alias}Status`] as UserStatus | null) ?? null,
  };
}

function idArray(value: unknown): Uuid[] {
  if (Array.isArray(value)) return value as Uuid[];
  // node-postgres returns uuid[] as "{a,b}" when the type parser is unknown.
  if (typeof value === 'string') {
    const inner = value.replace(/^\{|\}$/g, '');
    return inner ? (inner.split(',') as Uuid[]) : [];
  }
  return [];
}

async function paginate<T extends object, R>(
  qb: SelectQueryBuilder<T>,
  search: { pageNo: number; pageSize: number },
  order: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
  map: (raw: Raw) => R,
): Promise<PaginatedResult<R>> {
  const totalItems = await qb.getCount();
  const offset = (search.pageNo - 1) * search.pageSize;
  const rows =
    offset >= totalItems
      ? []
      : await order(qb).offset(offset).limit(search.pageSize).getRawMany<Raw>();
  const totalPages = Math.ceil(totalItems / search.pageSize);
  return {
    data: rows.map(map),
    pagination: {
      type: 'offset',
      pageNo: search.pageNo,
      pageSize: search.pageSize,
      totalItems,
      totalPages,
      hasNextPage: search.pageNo < totalPages,
      hasPreviousPage: search.pageNo > 1,
    },
  };
}

@Injectable()
export class ModerationQueryService implements IModerationQueryService {
  constructor(
    @InjectRepository(AccountAppealEntity)
    private readonly appeals: Repository<AccountAppealEntity>,
    @InjectRepository(UserReportEntity)
    private readonly reports: Repository<UserReportEntity>,
  ) {}

  findAppeals(
    search: AppealSearch,
  ): Promise<PaginatedResult<AppealListItemModel>> {
    const qb = this.selectAppeals();
    if (search.status !== undefined) {
      qb.andWhere('appeal.status = :status', { status: search.status });
    }
    if (search.userId !== undefined) {
      qb.andWhere('appeal.userId = :userId', { userId: search.userId });
    }
    // Pending appeals: oldest first (fair queue). Others: newest first.
    return paginate(
      qb,
      search,
      (query) =>
        search.status === AccountAppealStatus.PENDING
          ? query
              .orderBy('appeal.createdAt', 'ASC')
              .addOrderBy('appeal.id', 'ASC')
          : query
              .orderBy('appeal.createdAt', 'DESC')
              .addOrderBy('appeal.id', 'DESC'),
      (raw) => this.toAppealItem(raw),
    );
  }

  async findAppealById(id: Uuid): Promise<AppealDetailModel | null> {
    const qb = joinUser(
      this.selectAppeals()
        .addSelect('appeal.attachmentMediaIds', 'attachmentMediaIds')
        .addSelect('appeal.contactEmail', 'contactEmail')
        .addSelect('appeal.contactPhone', 'contactPhone')
        .addSelect('appeal.rejectReason', 'rejectReason')
        .addSelect('appeal.reviewedBy', 'reviewedBy'),
      'reviewer',
      'appeal.reviewedBy',
    ).andWhere('appeal.id = :id', { id });
    const raw = await qb.getRawOne<Raw>();
    if (!raw) return null;
    return {
      ...this.toAppealItem(raw),
      attachmentMediaIds: idArray(raw.attachmentMediaIds),
      contactEmail: (raw.contactEmail as string | null) ?? null,
      contactPhone: (raw.contactPhone as string | null) ?? null,
      rejectReason: (raw.rejectReason as string | null) ?? null,
      reviewedBy: raw.reviewedBy
        ? userSummary(raw, 'reviewer', raw.reviewedBy)
        : null,
    };
  }

  findReports(
    search: ReportSearch,
  ): Promise<PaginatedResult<ReportListItemModel>> {
    const qb = this.selectReports();
    if (search.status !== undefined) {
      qb.andWhere('report.status = :status', { status: search.status });
    }
    if (search.category !== undefined) {
      qb.andWhere('report.category = :category', {
        category: search.category,
      });
    }
    if (search.reportedUserId !== undefined) {
      qb.andWhere('report.reportedUserId = :reportedUserId', {
        reportedUserId: search.reportedUserId,
      });
    }
    return paginate(
      qb,
      search,
      (query) =>
        query
          .orderBy('report.createdAt', 'DESC')
          .addOrderBy('report.id', 'DESC'),
      (raw) => this.toReportItem(raw),
    );
  }

  async findReportById(id: Uuid): Promise<ReportDetailModel | null> {
    const qb = joinUser(
      this.selectReports()
        .addSelect('report.evidenceMediaIds', 'evidenceMediaIds')
        .addSelect('report.contextType', 'contextType')
        .addSelect('report.contextId', 'contextId')
        .addSelect('report.resolutionNote', 'resolutionNote')
        .addSelect('report.resolvedBy', 'resolvedBy'),
      'resolver',
      'report.resolvedBy',
    ).andWhere('report.id = :id', { id });
    const raw = await qb.getRawOne<Raw>();
    if (!raw) return null;
    return {
      ...this.toReportItem(raw),
      evidenceMediaIds: idArray(raw.evidenceMediaIds),
      contextType:
        (raw.contextType as ReportDetailModel['contextType']) ?? null,
      contextId: (raw.contextId as Uuid | null) ?? null,
      resolutionNote: (raw.resolutionNote as string | null) ?? null,
      resolvedBy: raw.resolvedBy
        ? userSummary(raw, 'resolver', raw.resolvedBy)
        : null,
    };
  }

  private selectAppeals(): SelectQueryBuilder<AccountAppealEntity> {
    const qb = this.appeals
      .createQueryBuilder('appeal')
      .select('appeal.id', 'id')
      .addSelect('appeal.userId', 'userId')
      .addSelect('appeal.lockReason', 'lockReason')
      .addSelect('appeal.lockedAt', 'lockedAt')
      .addSelect('appeal.content', 'content')
      .addSelect(
        'COALESCE(cardinality(appeal.attachment_media_ids), 0)',
        'attachmentCount',
      )
      .addSelect('appeal.status', 'status')
      .addSelect('appeal.createdAt', 'createdAt')
      .addSelect('appeal.reviewedAt', 'reviewedAt')
      .where('appeal.isDeleted = false');
    return joinUser(qb, 'appellant', 'appeal.userId');
  }

  private selectReports(): SelectQueryBuilder<UserReportEntity> {
    const qb = this.reports
      .createQueryBuilder('report')
      .select('report.id', 'id')
      .addSelect('report.reporterId', 'reporterId')
      .addSelect('report.reportedUserId', 'reportedUserId')
      .addSelect('report.category', 'category')
      .addSelect('report.description', 'description')
      .addSelect(
        'COALESCE(cardinality(report.evidence_media_ids), 0)',
        'evidenceCount',
      )
      .addSelect('report.status', 'status')
      .addSelect('report.createdAt', 'createdAt')
      .addSelect('report.resolvedAt', 'resolvedAt')
      .where('report.isDeleted = false');
    joinUser(qb, 'reporter', 'report.reporterId');
    return joinUser(qb, 'reported', 'report.reportedUserId');
  }

  private toAppealItem(raw: Raw): AppealListItemModel {
    return {
      id: raw.id as Uuid,
      user: userSummary(raw, 'appellant', raw.userId),
      lockReason: (raw.lockReason as string | null) ?? null,
      lockedAt: raw.lockedAt as Date,
      content: raw.content as string,
      attachmentCount: Number(raw.attachmentCount ?? 0),
      status: raw.status as AccountAppealStatus,
      createdAt: raw.createdAt as Date,
      reviewedAt: (raw.reviewedAt as Date | null) ?? null,
    };
  }

  private toReportItem(raw: Raw): ReportListItemModel {
    return {
      id: raw.id as Uuid,
      reporter: userSummary(raw, 'reporter', raw.reporterId),
      reportedUser: userSummary(raw, 'reported', raw.reportedUserId),
      category: raw.category as ReportListItemModel['category'],
      description: raw.description as string,
      evidenceCount: Number(raw.evidenceCount ?? 0),
      status: raw.status as ReportListItemModel['status'],
      createdAt: raw.createdAt as Date,
      resolvedAt: (raw.resolvedAt as Date | null) ?? null,
    };
  }
}
