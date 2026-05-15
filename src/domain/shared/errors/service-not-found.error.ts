export class ServiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Service not found: ${id}`);
    this.name = 'ServiceNotFoundError';
  }
}
