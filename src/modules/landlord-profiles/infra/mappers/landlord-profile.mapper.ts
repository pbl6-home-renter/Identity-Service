import { LandlordProfile } from '../../domain/entities/landlord-profile';
import { LandlordProfileEntity } from '../persistence/landlord-profile.entity';
import { PayoutAccount } from '../../domain/value-objects/payout-account.vo';

export class LandlordProfileMapper {
  static toDomain(raw: LandlordProfileEntity): LandlordProfile {
    return LandlordProfile.reconstitute({
      id: raw.id,
      userId: raw.userId,
      payoutAccount:
        raw.bankCode && raw.accountNumber && raw.accountName
          ? PayoutAccount.create({
              bankCode: raw.bankCode,
              accountNumber: raw.accountNumber,
              accountName: raw.accountName,
            })
          : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: LandlordProfile): LandlordProfileEntity {
    const raw = new LandlordProfileEntity();
    raw.id = domain.id;
    raw.userId = domain.userId;
    raw.bankCode = domain.payoutAccount?.bankCode ?? null;
    raw.accountNumber = domain.payoutAccount?.accountNumber ?? null;
    raw.accountName = domain.payoutAccount?.accountName ?? null;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
