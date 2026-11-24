import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { PaginatedResult } from 'shared/application/pagination/paginated-result';
import {
  IAuditLogQueryService,
  AuditLogSearch,
} from '../../application/ports/audit-log-query-service.port';
import { AuditLogDetail } from '../../application/queries/models/audit-log-detail.model';
import { AuditLogListItem } from '../../application/queries/models/audit-log-list-item.model';
import { AuditLogTypeormEntity } from '../persistence/audit-log.typeorm-entity';

@Injectable()
export class AuditLogQueryService implements IAuditLogQueryService {
  constructor(
    @InjectRepository(AuditLogTypeormEntity)
    private readonly repository: Repository<AuditLogTypeormEntity>,
  ) {}

  private selectItems() {
    return this.repository
      .createQueryBuilder('audit')
      .leftJoin(
        'users',
        'actor',
        'actor.id = audit.actorId AND actor.is_deleted = :actorIsDeleted',
        { actorIsDeleted: false },
      )
      .select('audit.id', 'id')
      .addSelect('audit.actorId', 'actorId')
      .addSelect('actor.name', 'actorName')
      .addSelect('audit.action', 'action')
      .addSelect('audit.entityType', 'entityType')
      .addSelect('audit.entityId', 'entityId')
      .addSelect('audit.sourceService', 'sourceService')
      .addSelect('audit.createdAt', 'createdAt');
  }

  async findAuditLogsAdmin(
    search: AuditLogSearch,
  ): Promise<PaginatedResult<AuditLogListItem>> {
    const qb = this.selectItems();
    if (search.action !== undefined)
      qb.andWhere('audit.action = :action', { action: search.action });
    if (search.entityType !== undefined)
      qb.andWhere('audit.entityType = :entityType', {
        entityType: search.entityType,
      });
    if (search.actorId !== undefined)
      qb.andWhere('audit.actorId = :actorId', { actorId: search.actorId });
    if (search.entityId !== undefined)
      qb.andWhere('audit.entityId = :entityId', { entityId: search.entityId });
    if (search.from !== undefined)
      qb.andWhere('audit.createdAt >= :from', { from: search.from });
    if (search.to !== undefined)
      qb.andWhere('audit.createdAt <= :to', { to: search.to });

    // The shared paginator hydrates entities; this projection also includes actorName.
    // Count before offset/limit so an empty page still reports the filtered total.
    const totalItems = await qb.getCount();
    const offset = (search.pageNo - 1) * search.pageSize;
    // An out-of-range page is empty, even when its offset exceeds PostgreSQL bigint.
    const data =
      offset >= totalItems
        ? []
        : await qb
            .orderBy('audit.createdAt', 'DESC')
            .addOrderBy('audit.id', 'DESC')
            .offset(offset)
            .limit(search.pageSize)
            .getRawMany<AuditLogListItem>();
    const totalPages = Math.ceil(totalItems / search.pageSize);
    return {
      data,
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

  async findById(id: Uuid): Promise<AuditLogDetail | null> {
    return (
      (await this.selectItems()
        .addSelect('audit.metadata', 'metadata')
        .where('audit.id = :id', { id })
        .getRawOne<AuditLogDetail>()) ?? null
    );
  }
}
