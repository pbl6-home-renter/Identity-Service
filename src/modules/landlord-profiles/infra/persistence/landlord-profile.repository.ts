import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { ILandlordProfileRepository } from '../../domain/repositories/landlord-profile.repository.interface';
import { LandlordProfile } from '../../domain/entities/landlord-profile';
import { LandlordProfileMapper } from '../mappers/landlord-profile.mapper';
import { LandlordProfileEntity } from './landlord-profile.entity';

@Injectable()
export class LandlordProfileRepository implements ILandlordProfileRepository {
  constructor(
    @InjectRepository(LandlordProfileEntity)
    private readonly repository: Repository<LandlordProfileEntity>,
  ) {}

  async findByUserId(userId: Uuid): Promise<LandlordProfile | null> {
    const raw = await this.repository.findOne({
      where: { userId, isDeleted: false },
    });

    return raw ? LandlordProfileMapper.toDomain(raw) : null;
  }

  async save(profile: LandlordProfile): Promise<void> {
    await this.repository.save(LandlordProfileMapper.toPersistence(profile));
  }
}
