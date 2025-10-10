-- DropForeignKey
ALTER TABLE "public"."HevyUserVerification" DROP CONSTRAINT "HevyUserVerification_userDiscordId_userHevyUsername_fkey";

-- AddForeignKey
ALTER TABLE "public"."HevyUserVerification" ADD CONSTRAINT "HevyUserVerification_userDiscordId_fkey" FOREIGN KEY ("userDiscordId") REFERENCES "public"."User"("discordId") ON DELETE RESTRICT ON UPDATE CASCADE;
