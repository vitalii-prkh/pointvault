import { ApiProperty } from '@nestjs/swagger';
import { LedgerEntryType } from './ledger-entry-type.enum.js';

export class LedgerEntryResponseDto {
  entryId!: string;
  memberId!: string;

  @ApiProperty({ enum: LedgerEntryType, enumName: 'LedgerEntryType' })
  type!: LedgerEntryType;

  points!: number;
  /**
   * Wallet balance after this entry was applied
   * */
  balanceAfter!: number;
  /**
   * ISO-8601 timestamp
   * */
  createdAt!: string;
}
