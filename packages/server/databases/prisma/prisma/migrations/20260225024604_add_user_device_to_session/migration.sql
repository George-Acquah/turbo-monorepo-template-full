/*
  Warnings:

  - The values [FACEBOOK] on the enum `AuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `token` on the `user_sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refresh_token_hash]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,device_id]` on the table `user_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `device_id` to the `user_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `user_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token_hash` to the `user_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "users"."AuthProvider_new" AS ENUM ('EMAIL', 'GOOGLE', 'GITHUB', 'APPLE', 'PHONE');
ALTER TABLE "users"."user_auth_providers" ALTER COLUMN "provider" TYPE "users"."AuthProvider_new" USING ("provider"::text::"users"."AuthProvider_new");
ALTER TYPE "users"."AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "users"."AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "users"."AuthProvider_old";
COMMIT;

-- DropIndex
DROP INDEX "users"."user_sessions_token_idx";

-- DropIndex
DROP INDEX "users"."user_sessions_token_key";

-- AlterTable
ALTER TABLE "users"."user_sessions" DROP COLUMN "token",
ADD COLUMN     "device_id" TEXT NOT NULL,
ADD COLUMN     "jti" TEXT NOT NULL,
ADD COLUMN     "refresh_token_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "users"."user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_device_id_idx" ON "users"."user_sessions"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_user_id_device_id_key" ON "users"."user_sessions"("user_id", "device_id");
