import {
  IsInt,
  IsISO4217CurrencyCode,
  IsPositive,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class PurchaseDto {
  @IsUUID()
  memberId!: string;

  /**
   * External order reference
   * */
  @IsString()
  @Length(1, 100)
  orderId!: string;

  /**
   * Amount in minor units (cents), so there are no floating-point money errors
   * */
  @IsInt()
  @IsPositive()
  amountMinor!: number;

  /**
   * ISO-4217 code, e.g. "EUR"
   * */
  @IsISO4217CurrencyCode()
  currency!: string;
}
