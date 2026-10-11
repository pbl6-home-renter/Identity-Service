import { User } from '../../domain/entities/user';
import { UserEntity as UserTypeormEntity } from '../persistence/user.entity';

export class UserMapper {
  static toDomain(raw: UserTypeormEntity): User {
    return User.create({
      id: raw.id,
      phone: raw.phone,
      email: raw.email,
      password: raw.password,
      name: raw.name,
      role: raw.role,
      status: raw.status,
      lockReason: raw.lockReason ?? null,
      lockedAt: raw.lockedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      isDeleted: raw.isDeleted,
    });
  }

  static toPersistence(domain: User): UserTypeormEntity {
    const raw = new UserTypeormEntity();
    raw.id = domain.id;
    raw.phone = domain.phone;
    raw.email = domain.email;
    raw.password = domain.password;
    raw.name = domain.name;
    raw.role = domain.role;
    raw.status = domain.status;
    raw.lockReason = domain.lockReason;
    raw.lockedAt = domain.lockedAt;
    raw.createdAt = domain.createdAt;
    raw.updatedAt = domain.updatedAt;
    raw.isDeleted = domain.isDeleted;
    return raw;
  }
}
