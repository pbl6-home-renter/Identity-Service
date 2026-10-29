import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaTable1793203840514 implements MigrationInterface {
  name = 'CreateMediaTable1793203840514';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_owner_type_enum" AS ENUM('user', 'room', 'building', 'contract', 'contract_member', 'meter_reading', 'issue_report', 'message')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_purpose_enum" AS ENUM('avatar', 'cover_photo', 'gallery_photo', 'ownership_proof', 'cccd_front', 'cccd_back', 'contract_template', 'contract_signed', 'meter_reading_evidence', 'issue_photo', 'chat_attachment')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_visibility_enum" AS ENUM('public', 'private')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_file_type_enum" AS ENUM('image', 'document', 'video', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_content_type_enum" AS ENUM('image/jpeg', 'image/png', 'image/webp', 'application/pdf')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_capture_source_enum" AS ENUM('camera_direct', 'device_storage')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_status_enum" AS ENUM('pending_upload', 'uploaded')`,
    );
    await queryRunner.query(
      `CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "owner_type" "public"."media_owner_type_enum" NOT NULL, "owner_id" uuid NOT NULL, "purpose" "public"."media_purpose_enum" NOT NULL, "visibility" "public"."media_visibility_enum" NOT NULL, "file_type" "public"."media_file_type_enum" NOT NULL DEFAULT 'image', "content_type" "public"."media_content_type_enum" NOT NULL, "file_name" character varying(255) NOT NULL, "size_bytes" integer NOT NULL, "capture_source" "public"."media_capture_source_enum", "user_id" uuid NOT NULL, "storage_key" character varying(512) NOT NULL, "status" "public"."media_status_enum" NOT NULL DEFAULT 'pending_upload', "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_media_storage_key" UNIQUE ("storage_key"), CONSTRAINT "PK_media" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_media_single_per_owner" ON "media" ("owner_type", "owner_id", "purpose") WHERE "purpose" IN ('avatar', 'cover_photo') AND "status" = 'uploaded' AND "is_deleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_owner" ON "media" ("owner_type", "owner_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ADD CONSTRAINT "FK_media_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media" DROP CONSTRAINT "FK_media_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_media_owner"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_media_single_per_owner"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TYPE "public"."media_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_capture_source_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_content_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_file_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_purpose_enum"`);
    await queryRunner.query(`DROP TYPE "public"."media_owner_type_enum"`);
  }
}
