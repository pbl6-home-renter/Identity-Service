import * as bcrypt from 'bcrypt';

export class BcryptUtils {
  private static readonly DEFAULT_SALT_ROUNDS = 10;

  static async hash(
    data: string | Buffer,
    saltOrRounds: string | number = BcryptUtils.DEFAULT_SALT_ROUNDS,
  ): Promise<string> {
    return bcrypt.hash(data, saltOrRounds);
  }

  static async compare(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }

  static hashSync(
    data: string | Buffer,
    saltOrRounds: string | number = BcryptUtils.DEFAULT_SALT_ROUNDS,
  ): string {
    return bcrypt.hashSync(data, saltOrRounds);
  }

  static compareSync(data: string | Buffer, encrypted: string): boolean {
    return bcrypt.compareSync(data, encrypted);
  }
}
