import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLockPeriods1794718540241 implements MigrationInterface {
  name = 'AddUserLockPeriods1794718540241';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_lock_periods" ("user_id" uuid NOT NULL, "locked_at" TIMESTAMP WITH TIME ZONE NOT NULL, "unlocked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_user_lock_periods_dates" CHECK (unlocked_at IS NULL OR unlocked_at >= locked_at), CONSTRAINT "PK_d6f085e040331b19ce56eee54ae" PRIMARY KEY ("user_id", "locked_at"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_lock_periods" ADD CONSTRAINT "FK_user_lock_periods_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_lock_periods" DROP CONSTRAINT "FK_user_lock_periods_user"`,
    );
    await queryRunner.query(`DROP TABLE "user_lock_periods"`);
  }
}
