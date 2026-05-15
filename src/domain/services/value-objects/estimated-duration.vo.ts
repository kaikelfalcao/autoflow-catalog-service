export class EstimatedDuration {
  readonly minutes: number;

  constructor(minutes: number) {
    if (!Number.isInteger(minutes) || minutes <= 0) {
      throw new Error('EstimatedDuration must be a positive integer (minutes)');
    }
    this.minutes = minutes;
  }
}
