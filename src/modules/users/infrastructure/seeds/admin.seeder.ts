import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { getConfigString } from 'shared/infrastructure/config/config-value';
import { BcryptPasswordHasher } from '../services/bcrypt-password-hasher';
import { UserEntity } from '../persistence/user.typeorm-entity';

export class AdminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(UserEntity);
    const config = new ConfigService();

    const id = getConfigString(
      config,
      'DEFAULT_ADMIN_ID',
      '00000000-0000-4000-8000-000000000001',
    ) as Uuid;
    const email = getConfigString(
      config,
      'DEFAULT_ADMIN_EMAIL',
      'admin@example.com',
    );
    const password = getConfigString(
      config,
      'DEFAULT_ADMIN_PASSWORD',
      'AdminPassword123!',
    );
    const name = getConfigString(
      config,
      'DEFAULT_ADMIN_NAME',
      'System Administrator',
    );
    const phone = getConfigString(config, 'DEFAULT_ADMIN_PHONE', '0900000000');

    const existingUser = await userRepository.findOne({
      where: [{ id }, { email }, { phone }],
    });

    if (existingUser) {
      return;
    }

    const hashedPassword = await new BcryptPasswordHasher().hash(password);

    const admin = userRepository.create({
      id,
      email,
      phone,
      name,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isDeleted: false,
      lockReason: null,
      lockedAt: null,
    });

    await userRepository.save(admin);
  }
}
