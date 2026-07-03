/*
  Warnings:

  - You are about to drop the `CalendarEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CalendarEventAssignees` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectDiscussionGroupType" AS ENUM ('general', 'discussion', 'suggestion', 'complaint', 'decision', 'question', 'announcement', 'feedback', 'improvement', 'other');

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_projectId_fkey";

-- DropForeignKey
ALTER TABLE "_CalendarEventAssignees" DROP CONSTRAINT "_CalendarEventAssignees_A_fkey";

-- DropForeignKey
ALTER TABLE "_CalendarEventAssignees" DROP CONSTRAINT "_CalendarEventAssignees_B_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "discussionGroupId" TEXT;

-- AlterTable
ALTER TABLE "TicketAttachment" ADD COLUMN     "uploadedById" TEXT;

-- DropTable
DROP TABLE "CalendarEvent";

-- DropTable
DROP TABLE "_CalendarEventAssignees";

-- DropEnum
DROP TYPE "CalendarEventType";

-- CreateTable
CREATE TABLE "ProjectDiscussionGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ProjectDiscussionGroupType" NOT NULL DEFAULT 'discussion',
    "content" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectDiscussionGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectDiscussionGroup" ADD CONSTRAINT "ProjectDiscussionGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDiscussionGroup" ADD CONSTRAINT "ProjectDiscussionGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_discussionGroupId_fkey" FOREIGN KEY ("discussionGroupId") REFERENCES "ProjectDiscussionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
