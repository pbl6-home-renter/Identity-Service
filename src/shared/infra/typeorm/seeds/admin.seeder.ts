import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserRole } from 'shared/domain/enums/user-role.enum';
import { UserStatus } from 'shared/domain/enums/user-status.enum';
import { Uuid } from 'shared/domain/value-objects/uuid.vo';
import { ApiConfigService } from 'shared/services/api-config.service';
import { BcryptUtils } from 'utils/bcrypt.utils';
import { UserEntity } from 'modules/users/infra/persistence/user.entity';

export class AdminSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(UserEntity);
    const apiConfigService = new ApiConfigService(new ConfigService());
    const adminConfig = apiConfigService.getAdminUser();

    const { email, password, name, phone } = adminConfig;
    const id = adminConfig.id as Uuid;

    const existingUser = await userRepository.findOne({
      where: [{ id }, { email }, { phone }],
    });

    if (existingUser) {
      return;
    }

    const hashedPassword = await BcryptUtils.hash(password);

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
