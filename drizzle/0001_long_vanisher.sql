ALTER TABLE "auth_account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "auth_account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential';--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "auth_account" WHERE "issuer" IS NULL) THEN
    RAISE EXCEPTION 'Cannot infer issuer for a legacy non-credential auth account';
  END IF;
END
$$;--> statement-breakpoint
ALTER TABLE "auth_account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
DROP INDEX "account_provider_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_idx" ON "auth_account" USING btree ("issuer","account_id");
