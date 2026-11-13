import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatVideoContentTypes1794576187545 implements MigrationInterface {
    name = 'AddChatVideoContentTypes1794576187545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."media_content_type_enum" ADD VALUE 'video/mp4'`);
        await queryRunner.query(`ALTER TYPE "public"."media_content_type_enum" ADD VALUE 'video/webm'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."media_content_type_enum_old" AS ENUM('image/jpeg', 'image/png', 'image/webp', 'application/pdf')`);
        await queryRunner.query(`ALTER TABLE "media" ALTER COLUMN "content_type" TYPE "public"."media_content_type_enum_old" USING "content_type"::"text"::"public"."media_content_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."media_content_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."media_content_type_enum_old" RENAME TO "media_content_type_enum"`);
    }

}
