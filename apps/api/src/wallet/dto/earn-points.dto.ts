import {
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';

export class EarnPointsDto {
  /**
   * Member receiving the points
   * */
  @IsUUID()
  memberId!: string;

  /**
   * Points to add (positive integer)
   * */
  @IsInt()
  @IsPositive()
  @Max(1_000_000)
  points!: number;

  /**
   * Why the points were awarded, e.g. "Welcome bonus"
   * */
  @IsString()
  @Length(1, 200)
  reason!: string;
}
