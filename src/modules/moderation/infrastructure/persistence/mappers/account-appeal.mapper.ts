import { AccountAppeal } from '../../../domain/entities/account-appeal';
import { AccountAppealEntity } from '../account-appeal.typeorm-entity';

export class AccountAppealMapper {
  static toDomain(raw: AccountAppealEntity): AccountAppeal {
    return AccountAppeal.reconstitute({
      id: raw.id,
      userId: raw.userId,
      lockedAt: raw.lockedAt,
      lockReason: raw.lockReason,
      content: raw.content,
      attachmentMediaIds: raw.attachmentMediaIds ?? [],
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
      status: raw.status,
      rejectReason: raw.rejectReason,
      reviewedBy: raw.reviewedBy,
      reviewedAt: raw.reviewedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(appeal: AccountAppeal): AccountAppealEntity {
    const raw = new AccountAppealEntity();
    Object.assign(raw, appeal.toProps());
    raw.isDeleted = false;
    return raw;
  }
}
