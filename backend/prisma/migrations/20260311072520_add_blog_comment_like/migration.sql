-- CreateTable
CREATE TABLE "BlogCommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BlogComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlogComment" ("content", "createdAt", "id", "postId", "updatedAt", "userId") SELECT "content", "createdAt", "id", "postId", "updatedAt", "userId" FROM "BlogComment";
DROP TABLE "BlogComment";
ALTER TABLE "new_BlogComment" RENAME TO "BlogComment";
CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE INDEX "BlogComment_createdAt_idx" ON "BlogComment"("createdAt");
CREATE INDEX "BlogComment_likeCount_idx" ON "BlogComment"("likeCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BlogCommentLike_commentId_idx" ON "BlogCommentLike"("commentId");

-- CreateIndex
CREATE INDEX "BlogCommentLike_userId_idx" ON "BlogCommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCommentLike_commentId_userId_key" ON "BlogCommentLike"("commentId", "userId");
