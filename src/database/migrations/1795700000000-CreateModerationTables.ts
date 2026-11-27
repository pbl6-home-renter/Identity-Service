import { MigrationInterface, QueryRunner } from 'typeorm';

/** P13-11: account appeals, user reports and their media purposes. */
export class CreateModerationTables1795700000000 implements MigrationInterface {
  name = 'CreateModerationTables1795700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."media_purpose_enum" ADD VALUE IF NOT EXISTS 'appeal_attachment'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."media_purpose_enum" ADD VALUE IF NOT EXISTS 'report_evidence'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."account_appeals_status_enum" AS ENUM('pending', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "account_appeals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, "locked_at" TIMESTAMP WITH TIME ZONE NOT NULL, "lock_reason" character varying(500), "content" text NOT NULL, "attachment_media_ids" uuid array NOT NULL DEFAULT '{}', "contact_email" character varying(254), "contact_phone" character varying(20), "status" "public"."account_appeals_status_enum" NOT NULL DEFAULT 'pending', "reject_reason" character varying(500), "reviewed_by" uuid, "reviewed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_account_appeals" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_account_appeals_user_locked_at" ON "account_appeals" ("user_id", "locked_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_account_appeals_status_created_at" ON "account_appeals" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_account_appeals_user_pending" ON "account_appeals" ("user_id") WHERE "status" = 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "account_appeals" ADD CONSTRAINT "FK_account_appeals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."user_reports_category_enum" AS ENUM('fraud', 'fake_listing', 'harassment', 'spam', 'impersonation', 'inappropriate_content', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_reports_context_type_enum" AS ENUM('conversation', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_reports_status_enum" AS ENUM('pending', 'dismissed', 'actioned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "reporter_id" uuid NOT NULL, "reported_user_id" uuid NOT NULL, "category" "public"."user_reports_category_enum" NOT NULL, "description" text NOT NULL, "evidence_media_ids" uuid array NOT NULL DEFAULT '{}', "context_type" "public"."user_reports_context_type_enum", "context_id" uuid, "status" "public"."user_reports_status_enum" NOT NULL DEFAULT 'pending', "resolution_note" character varying(500), "resolved_by" uuid, "resolved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_user_reports" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_reports_reported_status" ON "user_reports" ("reported_user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_reports_status_created_at" ON "user_reports" ("status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_reports_pending_pair" ON "user_reports" ("reporter_id", "reported_user_id") WHERE "status" = 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_user_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_reports" ADD CONSTRAINT "FK_user_reports_reported" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_reports"`);
    await queryRunner.query(`DROP TYPE "public"."user_reports_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_reports_context_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_reports_category_enum"`);
    await queryRunner.query(`DROP TABLE "account_appeals"`);
    await queryRunner.query(`DROP TYPE "public"."account_appeals_status_enum"`);

    // PostgreSQL cannot drop enum values: rebuild the media purpose type.
    await queryRunner.query(
      `DELETE FROM "media" WHERE "purpose" IN ('appeal_attachment', 'report_evidence')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_purpose_enum_old" AS ENUM('avatar', 'cover_photo', 'gallery_photo', 'ownership_proof', 'cccd_front', 'cccd_back', 'contract_template', 'contract_signed', 'meter_reading_evidence', 'issue_photo', 'chat_attachment', 'conversation_avatar')`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ALTER COLUMN "purpose" TYPE "public"."media_purpose_enum_old" USING "purpose"::"text"::"public"."media_purpose_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."media_purpose_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."media_purpose_enum_old" RENAME TO "media_purpose_enum"`,
    );
  }
}
