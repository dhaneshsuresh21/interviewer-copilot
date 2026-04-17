/*
  Warnings:

  - Added the required column `candidateEmail` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `candidatePhone` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InterviewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "candidatePhone" TEXT NOT NULL,
    "resumeText" TEXT,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "interviewerName" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "interviewerOverallScore" REAL NOT NULL DEFAULT 0,
    "interviewerRecommendation" TEXT NOT NULL DEFAULT 'maybe',
    "interviewerStrengths" TEXT NOT NULL DEFAULT '[]',
    "interviewerConcerns" TEXT NOT NULL DEFAULT '[]',
    "aiOverallScore" REAL NOT NULL DEFAULT 0,
    "aiRecommendation" TEXT NOT NULL DEFAULT 'maybe',
    "aiStrengths" TEXT NOT NULL DEFAULT '[]',
    "aiConcerns" TEXT NOT NULL DEFAULT '[]',
    "aiAnalysisText" TEXT,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "recommendation" TEXT NOT NULL DEFAULT 'maybe',
    "strengths" TEXT NOT NULL DEFAULT '[]',
    "concerns" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InterviewSession" ("aiAnalysisText", "aiConcerns", "aiOverallScore", "aiRecommendation", "aiStrengths", "candidateName", "company", "concerns", "createdAt", "duration", "endTime", "experienceLevel", "id", "interviewerConcerns", "interviewerName", "interviewerOverallScore", "interviewerRecommendation", "interviewerStrengths", "notes", "overallScore", "recommendation", "role", "startTime", "strengths", "updatedAt") SELECT "aiAnalysisText", "aiConcerns", "aiOverallScore", "aiRecommendation", "aiStrengths", "candidateName", "company", "concerns", "createdAt", "duration", "endTime", "experienceLevel", "id", "interviewerConcerns", "interviewerName", "interviewerOverallScore", "interviewerRecommendation", "interviewerStrengths", "notes", "overallScore", "recommendation", "role", "startTime", "strengths", "updatedAt" FROM "InterviewSession";
DROP TABLE "InterviewSession";
ALTER TABLE "new_InterviewSession" RENAME TO "InterviewSession";
CREATE INDEX "InterviewSession_role_idx" ON "InterviewSession"("role");
CREATE INDEX "InterviewSession_interviewerName_idx" ON "InterviewSession"("interviewerName");
CREATE INDEX "InterviewSession_startTime_idx" ON "InterviewSession"("startTime");
CREATE INDEX "InterviewSession_interviewerRecommendation_idx" ON "InterviewSession"("interviewerRecommendation");
CREATE INDEX "InterviewSession_aiRecommendation_idx" ON "InterviewSession"("aiRecommendation");
CREATE TABLE "new_InterviewTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT,
    "experienceLevel" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL,
    "jobDescription" TEXT,
    "presetQuestions" TEXT NOT NULL DEFAULT '[]',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InterviewTemplate" ("company", "createdAt", "experienceLevel", "id", "isDefault", "jobDescription", "name", "requiredSkills", "role", "updatedAt") SELECT "company", "createdAt", "experienceLevel", "id", "isDefault", "jobDescription", "name", "requiredSkills", "role", "updatedAt" FROM "InterviewTemplate";
DROP TABLE "InterviewTemplate";
ALTER TABLE "new_InterviewTemplate" RENAME TO "InterviewTemplate";
CREATE INDEX "InterviewTemplate_role_idx" ON "InterviewTemplate"("role");
CREATE INDEX "InterviewTemplate_isDefault_idx" ON "InterviewTemplate"("isDefault");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
