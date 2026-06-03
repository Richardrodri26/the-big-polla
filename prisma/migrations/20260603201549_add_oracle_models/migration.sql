-- CreateTable
CREATE TABLE "WorldCupTeam" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "c1" TEXT NOT NULL,
    "c2" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldCupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OraclePick" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "teamCode" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OraclePick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldCupTeam_code_key" ON "WorldCupTeam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OraclePick_userId_round_slotId_key" ON "OraclePick"("userId", "round", "slotId");

-- AddForeignKey
ALTER TABLE "OraclePick" ADD CONSTRAINT "OraclePick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
