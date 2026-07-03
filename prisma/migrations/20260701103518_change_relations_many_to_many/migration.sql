/*
  Warnings:

  - You are about to drop the column `discussionGroupId` on the `Ticket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_discussionGroupId_fkey";

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "discussionGroupId";

-- CreateTable
CREATE TABLE "_ProjectDiscussionGroupToTicket" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectDiscussionGroupToTicket_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DiscussionGroupMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DiscussionGroupMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProjectDiscussionGroupToTicket_B_index" ON "_ProjectDiscussionGroupToTicket"("B");

-- CreateIndex
CREATE INDEX "_DiscussionGroupMembers_B_index" ON "_DiscussionGroupMembers"("B");

-- AddForeignKey
ALTER TABLE "_ProjectDiscussionGroupToTicket" ADD CONSTRAINT "_ProjectDiscussionGroupToTicket_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectDiscussionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectDiscussionGroupToTicket" ADD CONSTRAINT "_ProjectDiscussionGroupToTicket_B_fkey" FOREIGN KEY ("B") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionGroupMembers" ADD CONSTRAINT "_DiscussionGroupMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectDiscussionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionGroupMembers" ADD CONSTRAINT "_DiscussionGroupMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
