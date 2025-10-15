-- CreateTable
CREATE TABLE "public"."UserAutoShareConfig" (
    "userId" UUID NOT NULL,
    "guildId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAutoShareConfig_pkey" PRIMARY KEY ("userId","guildId")
);

-- AddForeignKey
ALTER TABLE "public"."UserAutoShareConfig" ADD CONSTRAINT "UserAutoShareConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAutoShareConfig" ADD CONSTRAINT "UserAutoShareConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."Server"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
