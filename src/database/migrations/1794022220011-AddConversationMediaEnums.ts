import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationMediaEnums1794022220011 implements MigrationInterface {
  name = 'AddConversationMediaEnums1794022220011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."media_owner_type_enum" ADD VALUE 'conversation'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."media_purpose_enum" ADD VALUE 'conversation_avatar'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."media_purpose_enum_old" AS ENUM('avatar', 'cover_photo', 'gallery_photo', 'ownership_proof', 'cccd_front', 'cccd_back', 'contract_template', 'contract_signed', 'meter_reading_evidence', 'issue_photo', 'chat_attachment')`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ALTER COLUMN "purpose" TYPE "public"."media_purpose_enum_old" USING "purpose"::"text"::"public"."media_purpose_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."media_purpose_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."media_purpose_enum_old" RENAME TO "media_purpose_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."media_owner_type_enum_old" AS ENUM('user', 'room', 'building', 'contract', 'contract_member', 'meter_reading', 'issue_report', 'message')`,
    );
    await queryRunner.query(
      `ALTER TABLE "media" ALTER COLUMN "owner_type" TYPE "public"."media_owner_type_enum_old" USING "owner_type"::"text"::"public"."media_owner_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."media_owner_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."media_owner_type_enum_old" RENAME TO "media_owner_type_enum"`,
    );
  }
}
