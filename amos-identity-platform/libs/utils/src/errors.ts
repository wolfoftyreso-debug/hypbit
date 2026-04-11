export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', 404, `${resource}${id ? ` ${id}` : ''} not found`);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', 409, message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ExternalProviderError extends DomainError {
  constructor(provider: string, message: string, details?: unknown) {
    super('EXTERNAL_PROVIDER_ERROR', 502, `${provider}: ${message}`, details);
  }
}
