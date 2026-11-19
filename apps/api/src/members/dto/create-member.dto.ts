import { IsEmail, IsString, Length } from 'class-validator';

export class CreateMemberDto {
  /**
   * Unique per member
   * */
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 100)
  displayName!: string;
}
