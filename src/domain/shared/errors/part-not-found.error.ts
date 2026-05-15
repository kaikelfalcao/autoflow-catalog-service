export class PartNotFoundError extends Error {
  constructor(id: string) {
    super(`Part not found: ${id}`);
    this.name = 'PartNotFoundError';
  }
}
