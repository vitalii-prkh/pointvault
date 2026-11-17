export class WalletBalanceResponseDto {
  memberId!: string;

  /**
   * Current points balance
   * */
  balance!: number;

  /**
   * ISO-8601 timestamp of the last balance change
   * */
  updatedAt!: string;
}
