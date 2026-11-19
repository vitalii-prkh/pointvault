export class MemberResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  /**
   * ISO-8601 timestamp
   * */
  createdAt!: string;
}
