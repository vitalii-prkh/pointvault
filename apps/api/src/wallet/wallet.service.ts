import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EarnPointsDto } from './dto/earn-points.dto.js';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto.js';
import { LedgerEntryType } from './dto/ledger-entry-type.enum.js';
import { RedeemPointsDto } from './dto/redeem-points.dto.js';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto.js';
import { SYSTEM_WALLETS } from './system-wallets.js';

interface Posting {
  type: LedgerEntryType;
  memberId: string;
  points: number;
  description: string;
  idempotencyKey?: string;
}

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  earn(
    dto: EarnPointsDto,
    idempotencyKey?: string,
  ): Promise<LedgerEntryResponseDto> {
    return this.post({
      type: LedgerEntryType.EARN,
      memberId: dto.memberId,
      points: dto.points,
      description: dto.reason,
      idempotencyKey,
    });
  }

  redeem(
    dto: RedeemPointsDto,
    idempotencyKey?: string,
  ): Promise<LedgerEntryResponseDto> {
    return this.post({
      type: LedgerEntryType.REDEEM,
      memberId: dto.memberId,
      points: dto.points,
      description: dto.rewardId,
      idempotencyKey,
    });
  }

  async getBalance(memberId: string): Promise<WalletBalanceResponseDto> {
    const wallet = await this.prisma.wallet.findUnique({ where: { memberId } });

    if (!wallet) {
      throw new NotFoundException('Member has no wallet');
    }

    return {
      memberId,
      balance: wallet.balance,
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }

  /**
   * Double-entry posting: the member wallet and a system wallet move by the same amount in opposite
   * directions, inside one database transaction. Either both entries are written or neither is.
   */
  private async post(p: Posting): Promise<LedgerEntryResponseDto> {
    if (p.idempotencyKey) {
      const replay = await this.findReplay(p);

      if (replay) {
        return replay;
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { memberId: p.memberId },
        });

        if (!wallet) {
          throw new NotFoundException('Member has no wallet');
        }

        const memberDelta =
          p.type === LedgerEntryType.EARN ? p.points : -p.points;
        const systemWalletId =
          p.type === LedgerEntryType.EARN
            ? SYSTEM_WALLETS.ISSUANCE
            : SYSTEM_WALLETS.REDEMPTION;

        const transaction = await tx.ledgerTransaction.create({
          data: {
            type: p.type,
            description: p.description,
            idempotencyKey: p.idempotencyKey,
          },
        });

        // Redeem only matches when the balance covers it. The row lock this takes also stops two
        // concurrent redeems from both passing the check.
        const updated = await tx.wallet.update({
          where:
            memberDelta < 0
              ? { id: wallet.id, balance: { gte: p.points } }
              : { id: wallet.id },
          data: { balance: { increment: memberDelta } },
        });
        const system = await tx.wallet.update({
          where: { id: systemWalletId },
          data: { balance: { increment: -memberDelta } },
        });
        const entry = await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            walletId: wallet.id,
            amount: memberDelta,
            balanceAfter: updated.balance,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionId: transaction.id,
            walletId: system.id,
            amount: -memberDelta,
            balanceAfter: system.balance,
          },
        });

        return this.toResponse(entry, p.type, p.memberId);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2025: the guarded update matched no row, so the balance was too low.
        if (error.code === 'P2025')
          throw new ConflictException('Insufficient balance');
        // P2002 on the idempotency key: a concurrent request with the same key won the race.
        if (error.code === 'P2002' && p.idempotencyKey) {
          const replay = await this.findReplay(p);

          if (replay) {
            return replay;
          }
        }
      }
      throw error;
    }
  }

  /**
   * Returns the original result for a repeated Idempotency-Key, or rejects a key reused for a different request.
   */
  private async findReplay(p: Posting): Promise<LedgerEntryResponseDto | null> {
    const existing = await this.prisma.ledgerTransaction.findUnique({
      where: { idempotencyKey: p.idempotencyKey },
      include: { entries: { include: { wallet: true } } },
    });

    if (!existing) {
      return null;
    }

    const memberEntry = existing.entries.find(
      (e) => e.wallet.memberId !== null,
    );
    const sameRequest =
      existing.type === p.type &&
      memberEntry?.wallet.memberId === p.memberId &&
      Math.abs(memberEntry.amount) === p.points;

    if (!memberEntry || !sameRequest) {
      throw new ConflictException(
        'Idempotency-Key was already used for a different request',
      );
    }

    return this.toResponse(memberEntry, p.type, p.memberId);
  }

  private toResponse(
    entry: {
      id: string;
      amount: number;
      balanceAfter: number;
      createdAt: Date;
    },
    type: LedgerEntryType,
    memberId: string,
  ): LedgerEntryResponseDto {
    return {
      entryId: entry.id,
      memberId,
      type,
      points: Math.abs(entry.amount),
      balanceAfter: entry.balanceAfter,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
