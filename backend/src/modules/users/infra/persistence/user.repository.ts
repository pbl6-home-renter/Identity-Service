import { RefreshTokenEntity } from 'modules/auth/infra/persistence/refresh-token.entity';
import { LandlordProfileEntity } from 'modules/landlord-profiles/infra/persistence/landlord-profile.entity';
import { PayoutAccount } from 'modules/landlord-profiles/domain/value-objects/payout-account';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InvalidCurrentPasswordException } from '../../domain/exceptions/invalid-current-password.exception';
import { PhoneAlreadyExistsException } from 'modules/auth/domain/exceptions/phone-already-exists.exception';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user';
import { UserEntity } from './user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { IOffsetPaginationQueryRequestDto } from 'shared/domain/pagination/i-offset-pagination.query.request.dto';
import { IPaginationResponseDto } from 'shared/domain/pagination/i-pagination.response.dto';
import { TypeOrmPaginator } from 'shared/infra/typeorm/pagination/typeorm.paginator';
import { LandlordProfileMapper } from 'modules/landlord-profiles/infra/mappers/landlord-profile.mapper';
import { IGetMeQueryRepository } from '../../use-case/queries/repositories/get-me-query.repository.interface';
import { GetMeUserModel } from '../../use-case/queries/models/get-me-user.model';

@Injectable()
export class UserRepository implements IUserRepository, IGetMeQueryRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async save(user: User): Promise<void> {
    const raw = UserMapper.toPersistence(user);
    await this.repository.save(raw);
  }

  async saveProfile(
    user: User,
    payoutAccount?: PayoutAccount | null,
  ): Promise<PayoutAccount | null> {
    try {
      return await this.repository.manager.transaction(async (manager) => {
        const stored = await manager.findOne(UserEntity, {
          where: { id: user.id, isDeleted: false },
          lock: { mode: 'pessimistic_write' },
        });
        if (!stored) throw new UserNotFoundException();
        await manager.update(UserEntity, stored.id, {
          name: user.name,
          phone: user.phone,
        });
        if (stored.role !== UserRole.LANDLORD) return null;
        const profiles = manager.getRepository(LandlordProfileEntity);
        let profile = await profiles.findOne({
          where: { userId: user.id, isDeleted: false },
        });
        if (payoutAccount !== undefined) {
          if (payoutAccount || profile) {
            profile = profile ?? profiles.create({ userId: user.id });
            Object.assign(profile, {
              bankCode: payoutAccount?.bankCode ?? null,
              accountNumber: payoutAccount?.accountNumber ?? null,
              accountName: payoutAccount?.accountName ?? null,
            });
            profile = await profiles.save(profile);
          }
        }
        return profile?.bankCode && profile.accountNumber && profile.accountName
          ? {
              bankCode: profile.bankCode,
              accountNumber: profile.accountNumber,
              accountName: profile.accountName,
            }
          : null;
      });
    } catch (error) {
      const pg = (
        error as { driverError?: { code?: string; constraint?: string } }
      ).driverError;
      if (
        pg?.code === '23505' &&
        pg.constraint === 'UQ_a000cca60bcf04454e727699490'
      )
        throw new PhoneAlreadyExistsException(user.phone);
      throw error;
    }
  }

  async changePassword(
    userId: Uuid,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: userId, isDeleted: false },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new UserNotFoundException();
      if (!(await BcryptUtils.compare(currentPassword, user.password)))
        throw new InvalidCurrentPasswordException();
      await manager.update(UserEntity, userId, {
        password: await BcryptUtils.hash(newPassword),
      });
      await manager
        .createQueryBuilder()
        .update(RefreshTokenEntity)
        .set({ revokedAt: new Date() })
        .where('user_id = :userId', { userId })
        .andWhere('revoked_at IS NULL')
        .execute();
    });
  }

  async findById(id: Uuid): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { id, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByUserId(id: Uuid): Promise<GetMeUserModel | null> {
    const raw = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.landlordProfile',
        'landlordProfile',
        'landlordProfile.is_deleted = :profileIsDeleted',
        { profileIsDeleted: false },
      )
      .where('user.id = :id', { id })
      .andWhere('user.is_deleted = :isDeleted', { isDeleted: false })
      .getOne();

    if (!raw) {
      return null;
    }

    return {
      user: UserMapper.toDomain(raw),
      landlordProfile: raw.landlordProfile
        ? LandlordProfileMapper.toDomain(raw.landlordProfile)
        : null,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { email, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { phone, isDeleted: false },
    });
    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const raw = await this.repository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(user.email = :identifier OR user.phone = :identifier)', {
        identifier,
      })
      .getOne();

    if (!raw) {
      return null;
    }
    return UserMapper.toDomain(raw);
  }

  async findAll(): Promise<User[]> {
    const records = await this.repository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return records.map((r) => UserMapper.toDomain(r));
  }

  async findPaginated(
    options: IOffsetPaginationQueryRequestDto,
  ): Promise<IPaginationResponseDto<User>> {
    const qb = this.repository
      .createQueryBuilder('user')
      .where('user.isDeleted = :isDeleted', { isDeleted: false });

    return TypeOrmPaginator.offset(qb, options)
      .withSort({
        whitelist: ['createdAt', 'name', 'email', 'phone'],
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
        alias: 'user',
      })
      .paginate((raw) => UserMapper.toDomain(raw));
  }

  async delete(id: Uuid): Promise<void> {
    await this.repository.update(id, { isDeleted: true });
  }
}
