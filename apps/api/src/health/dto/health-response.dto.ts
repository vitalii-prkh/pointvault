export class HealthResponseDto {
  /**
   * Always "ok" when the process is up
   * */
  status!: 'ok';
  uptimeSeconds!: number;
}
