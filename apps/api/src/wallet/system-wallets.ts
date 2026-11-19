/**
 * Fixed ids of the system wallets inserted by the init migration.
 */
export const SYSTEM_WALLETS = {
  /**
   * Source of every earned point
   */
  ISSUANCE: '00000000-0000-0000-0000-000000000001',
  /**
   * Destination of every redeemed point
   */
  REDEMPTION: '00000000-0000-0000-0000-000000000002',
} as const;
