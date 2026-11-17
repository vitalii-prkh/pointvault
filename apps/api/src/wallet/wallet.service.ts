import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EarnPointsDto } from './dto/earn-points.dto.js';
import { RedeemPointsDto } from './dto/redeem-points.dto.js';
import { LedgerEntryResponseDto } from './dto/ledger-entry-response.dto.js';
import { LedgerEntryType } from './dto/ledger-entry-type.enum.js';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto.js';

// Phase 1: mocked responses. Phase 2 replaces these with Postgres transactions.
@Injectable()
export class WalletService {
  earn(dto: EarnPointsDto): LedgerEntryResponseDto {
    return this.mockEntry(dto.memberId, LedgerEntryType.EARN, dto.points);
  }

  redeem(dto: RedeemPointsDto): LedgerEntryResponseDto {
    return this.mockEntry(dto.memberId, LedgerEntryType.REDEEM, dto.points);
  }

  getBalance(memberId: string): WalletBalanceResponseDto {
    // Phase 2: read from the wallets table; throw NotFoundException if the member has no wallet.
    return {
      memberId,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  private mockEntry(
    memberId: string,
    type: LedgerEntryType,
    points: number,
  ): LedgerEntryResponseDto {
    return {
      entryId: randomUUID(),
      memberId,
      type,
      points,
      balanceAfter: 0,
      createdAt: new Date().toISOString(),
    };
  }
}
