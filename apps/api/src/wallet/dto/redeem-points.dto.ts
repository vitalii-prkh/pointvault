import {
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';

export class RedeemPointsDto {
  @IsUUID()
  memberId!: string;

  /** Points to spend (positive integer) */
  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  points!: number;

  /** Reward being redeemed */
  @IsString()
  @Length(1, 100)
  rewardId!: string;
}
