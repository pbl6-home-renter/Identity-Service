import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenFamily1792500000000 implements MigrationInterface {
  name = 'AddRefreshTokenFamily1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "family_id" uuid`,
    );
    // Each existing token becomes its own family.
    await queryRunner.query(
      `UPDATE "refresh_tokens" SET "family_id" = "id" WHERE "family_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ALTER COLUMN "family_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "UQ_refresh_tokens_token_hash"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_family_id"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "family_id"`,
    );
  }
}
