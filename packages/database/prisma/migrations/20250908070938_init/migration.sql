-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "discordId" TEXT NOT NULL,
    "hevyUsername" TEXT,
    "hevyApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerifiedOnHevy" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "public"."User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_hevyUsername_key" ON "public"."User"("hevyUsername");

-- CreateIndex
CREATE UNIQUE INDEX "User_hevyApiKey_key" ON "public"."User"("hevyApiKey");
