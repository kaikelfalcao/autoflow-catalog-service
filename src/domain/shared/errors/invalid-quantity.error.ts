export class InvalidQuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuantityError';
  }
}
