import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityTables1760146000000 implements MigrationInterface {
  name = 'CreateIdentityTables1760146000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Ensure uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2. Create Enums if not exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('landlord', 'tenant', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'locked');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Create users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "phone" character varying(12) NOT NULL,
        "email" character varying(254) NOT NULL,
        "password" character varying(255) NOT NULL,
        "name" character varying(254) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "status" "public"."users_status_enum" NOT NULL DEFAULT 'active',
        "lock_reason" character varying(500),
        "locked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);

    // 4. Create landlord_profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "landlord_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "user_id" uuid NOT NULL,
        "bank_code" character varying(20),
        "account_number" character varying(20),
        "account_name" character varying(254),
        CONSTRAINT "UQ_landlord_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_landlord_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_landlord_profiles_users_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 5. Create refresh_tokens table (ke thua day du BaseEntity: id, created_at, updated_at, is_deleted)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "is_deleted" boolean NOT NULL DEFAULT false,
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_users_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 6. Indices for foreign keys
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_refresh_tokens_user_id";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "landlord_profiles";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_status_enum";`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum";`);
  }
}
