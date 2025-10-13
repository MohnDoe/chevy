/*
  Warnings:

  - The values [unlinked] on the enum `UserVerificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserVerificationStatus_new" AS ENUM ('verified', 'pending');
ALTER TABLE "public"."HevyVerification" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."HevyVerification" ALTER COLUMN "status" TYPE "public"."UserVerificationStatus_new" USING ("status"::text::"public"."UserVerificationStatus_new");
ALTER TYPE "public"."UserVerificationStatus" RENAME TO "UserVerificationStatus_old";
ALTER TYPE "public"."UserVerificationStatus_new" RENAME TO "UserVerificationStatus";
DROP TYPE "public"."UserVerificationStatus_old";
ALTER TABLE "public"."HevyVerification" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;
