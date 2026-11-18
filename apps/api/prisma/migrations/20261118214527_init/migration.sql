-- CreateEnum
CREATE TYPE "WalletKind" AS ENUM ('MEMBER', 'SYSTEM_ISSUANCE', 'SYSTEM_REDEMPTION');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('EARN', 'REDEEM');

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "kind" "WalletKind" NOT NULL DEFAULT 'MEMBER',
    "member_id" UUID,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "idempotency_key" TEXT,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_member_id_key" ON "wallets"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_idempotency_key_key" ON "ledger_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_entries_wallet_id_created_at_idx" ON "ledger_entries"("wallet_id", "created_at");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: rules Prisma's schema language can't express.
-- ---------------------------------------------------------------------------

-- A member wallet can never go negative. This is the last line of defence; the service also checks.
ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_member_balance_non_negative"
    CHECK ("kind" <> 'MEMBER' OR "balance" >= 0);

-- Member wallets belong to a member; system wallets don't.
ALTER TABLE "wallets"
  ADD CONSTRAINT "wallets_member_id_matches_kind"
    CHECK (("kind" = 'MEMBER') = ("member_id" IS NOT NULL));

-- An entry always moves points.
ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_amount_non_zero"
    CHECK ("amount" <> 0);

-- The two system wallets every transaction posts against. Fixed ids so the app can reference them.
INSERT INTO "wallets" ("id", "kind", "balance", "updated_at") VALUES
                                                                ('00000000-0000-0000-0000-000000000001', 'SYSTEM_ISSUANCE', 0, now()),
                                                                ('00000000-0000-0000-0000-000000000002', 'SYSTEM_REDEMPTION', 0, now());
