-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "discussionGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_discussionGroupId_fkey" FOREIGN KEY ("discussionGroupId") REFERENCES "ProjectDiscussionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
