import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpgradeAuditLogsForUserActions1795440754831 implements MigrationInterface {
  name = 'UpgradeAuditLogsForUserActions1795440754831';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "source_service" character varying(30) NOT NULL DEFAULT 'identity'`,
    );
    await queryRunner.query(
      `UPDATE "audit_logs" SET "metadata" = '{}'::jsonb WHERE "metadata" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "metadata" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "metadata" SET DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action_created" ON "audit_logs"  ("action", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created" ON "audit_logs"  ("created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_action_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "metadata" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "metadata" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "source_service"`,
    );
  }
}
