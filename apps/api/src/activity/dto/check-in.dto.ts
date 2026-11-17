import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  memberId!: string;

  /**
   * Store / venue identifier (optional)
   * */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  locationId?: string;
}
