# Generated migration to remove 2FA fields

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
            sql="""
            CREATE TABLE IF NOT EXISTS "accounts_user_new" (
                "password" varchar(128) NOT NULL,
                "is_superuser" bool NOT NULL,
                "id" char(32) NOT NULL PRIMARY KEY,
                "email" varchar(254) NOT NULL UNIQUE,
                "phone_number" varchar(17) NULL UNIQUE,
                "first_name" varchar(100) NOT NULL,
                "last_name" varchar(100) NOT NULL,
                "avatar_url" varchar(500) NULL,
                "role" varchar(20) NOT NULL,
                "is_active" bool NOT NULL,
                "is_staff" bool NOT NULL,
                "is_verified" bool NOT NULL,
                "login_attempts" integer NOT NULL,
                "locked_until" datetime NULL,
                "created_by_id" char(32) NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED,
                "updated_by_id" char(32) NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED,
                "metadata" text NULL CHECK ((JSON_VALID("metadata") OR "metadata" IS NULL)),
                "date_joined" datetime NOT NULL,
                "last_login" datetime NULL,
                "created_at" datetime NOT NULL,
                "updated_at" datetime NOT NULL
            );
            
            INSERT INTO "accounts_user_new" (
                "password", "is_superuser", "id", "email", "phone_number", 
                "first_name", "last_name", "avatar_url", "role", "is_active", 
                "is_staff", "is_verified", "login_attempts", "locked_until", 
                "created_by_id", "updated_by_id", "metadata", "date_joined", 
                "last_login", "created_at", "updated_at"
            )
            SELECT 
                "password", "is_superuser", "id", "email", "phone_number", 
                "first_name", "last_name", "avatar_url", "role", "is_active", 
                "is_staff", "is_verified", "login_attempts", "locked_until", 
                "created_by_id", "updated_by_id", "metadata", "date_joined", 
                "last_login", "created_at", "updated_at"
            FROM "accounts_user";
            
            DROP TABLE "accounts_user";
            ALTER TABLE "accounts_user_new" RENAME TO "accounts_user";
            
            CREATE INDEX IF NOT EXISTS "accounts_us_email_74c8d6_idx" ON "accounts_user" ("email");
            CREATE INDEX IF NOT EXISTS "accounts_us_phone_n_613c4a_idx" ON "accounts_user" ("phone_number");
            CREATE INDEX IF NOT EXISTS "accounts_us_role_2b136f_idx" ON "accounts_user" ("role", "is_active");
            CREATE INDEX IF NOT EXISTS "accounts_us_created_4734df_idx" ON "accounts_user" ("created_at");
            
            -- Also remove 2FA fields from historical table
            CREATE TABLE IF NOT EXISTS "accounts_historicaluser_new" (
                "password" varchar(128) NOT NULL,
                "is_superuser" bool NOT NULL,
                "id" char(32) NOT NULL,
                "email" varchar(254) NOT NULL,
                "phone_number" varchar(17) NULL,
                "first_name" varchar(100) NOT NULL,
                "last_name" varchar(100) NOT NULL,
                "avatar_url" varchar(500) NULL,
                "role" varchar(20) NOT NULL,
                "is_active" bool NOT NULL,
                "is_staff" bool NOT NULL,
                "is_verified" bool NOT NULL,
                "login_attempts" integer NOT NULL,
                "locked_until" datetime NULL,
                "metadata" text NULL CHECK ((JSON_VALID("metadata") OR "metadata" IS NULL)),
                "date_joined" datetime NOT NULL,
                "last_login" datetime NULL,
                "created_at" datetime NOT NULL,
                "updated_at" datetime NOT NULL,
                "created_by_id" char(32) NULL,
                "updated_by_id" char(32) NULL,
                "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
                "history_date" datetime NOT NULL,
                "history_change_reason" varchar(100) NULL,
                "history_type" varchar(1) NOT NULL,
                "history_user_id" char(32) NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED
            );
            
            INSERT INTO "accounts_historicaluser_new" (
                "password", "is_superuser", "id", "email", "phone_number", 
                "first_name", "last_name", "avatar_url", "role", "is_active", 
                "is_staff", "is_verified", "login_attempts", "locked_until", 
                "metadata", "date_joined", "last_login", "created_at", "updated_at",
                "created_by_id", "updated_by_id", "history_id", "history_date", 
                "history_change_reason", "history_type", "history_user_id"
            )
            SELECT 
                "password", "is_superuser", "id", "email", "phone_number", 
                "first_name", "last_name", "avatar_url", "role", "is_active", 
                "is_staff", "is_verified", "login_attempts", "locked_until", 
                "metadata", "date_joined", "last_login", "created_at", "updated_at",
                "created_by_id", "updated_by_id", "history_id", "history_date", 
                "history_change_reason", "history_type", "history_user_id"
            FROM "accounts_historicaluser";
            
            DROP TABLE "accounts_historicaluser";
            ALTER TABLE "accounts_historicaluser_new" RENAME TO "accounts_historicaluser";
            
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_id_d7601895" ON "accounts_historicaluser" ("id");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_email_ae72eda2" ON "accounts_historicaluser" ("email");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_phone_number_82d46b17" ON "accounts_historicaluser" ("phone_number");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_role_d0b75242" ON "accounts_historicaluser" ("role");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_created_by_id_ade78c99" ON "accounts_historicaluser" ("created_by_id");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_updated_by_id_26633ed3" ON "accounts_historicaluser" ("updated_by_id");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_history_date_94c91976" ON "accounts_historicaluser" ("history_date");
            CREATE INDEX IF NOT EXISTS "accounts_historicaluser_history_user_id_db1b2c5f" ON "accounts_historicaluser" ("history_user_id");
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

