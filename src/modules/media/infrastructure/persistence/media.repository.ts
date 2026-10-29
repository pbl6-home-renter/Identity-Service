import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionContext } from 'shared/domain/repositories/transaction-context';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { withTransaction } from 'shared/infrastructure/database/transaction/typeorm-transaction-context';
import { Media } from '../../domain/entities/media';
import { MediaOwnerType } from '../../domain/enums/media-owner-type.enum';
import { MediaPurpose } from '../../domain/enums/media-purpose.enum';
import { MediaStatus } from '../../domain/enums/media-status.enum';
import { IMediaRepository } from '../../domain/repositories/media.repository.interface';
import { MediaMapper } from './mappers/media.mapper';
import { MediaEntity } from './media.typeorm-entity';

@Injectable()
export class MediaRepository implements IMediaRepository {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly repository: Repository<MediaEntity>,
  ) {}

  async save(media: Media, context?: TransactionContext): Promise<void> {
    await withTransaction(this.repository, context).save(
      MediaMapper.toPersistence(media),
    );
  }

  async findById(id: Uuid): Promise<Media | null> {
    const raw = await this.repository.findOne({ where: { id } });
    return raw ? MediaMapper.toDomain(raw) : null;
  }

  async findUploadedByOwner(
    ownerType: MediaOwnerType,
    ownerId: Uuid,
    purpose: MediaPurpose,
  ): Promise<Media[]> {
    const rows = await this.repository.find({
      where: {
        ownerType,
        ownerId,
        purpose,
        status: MediaStatus.UPLOADED,
        isDeleted: false,
      },
    });

    return rows.map((raw) => MediaMapper.toDomain(raw));
  }
}
