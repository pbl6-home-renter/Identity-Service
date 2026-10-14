import { LandlordProfile } from '../../domain/entities/landlord-profile';
import { LandlordProfileEntity } from '../persistence/landlord-profile.entity';

export class LandlordProfileMapper {
  static toDomain(raw: LandlordProfileEntity): LandlordProfile {
    return LandlordProfile.create({
      id: raw.id,
      userId: raw.userId,
      bankCode: raw.bankCode ?? null,
      accountNumber: raw.accountNumber ?? null,
      accountName: raw.accountName ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: LandlordProfile): LandlordProfileEntity {
    const raw = new LandlordProfileEntity();
    raw.id = domain.id;
    raw.userId = domain.userId;
    raw.bankCode = domain.bankCode;
    raw.accountNumber = domain.accountNumber;
    raw.accountName = domain.accountName;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
