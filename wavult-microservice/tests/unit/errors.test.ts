import { AppError, NotFoundError, ValidationError } from '../../src/errors';

describe('AppError hierarchy', () => {
  it('NotFoundError has correct properties', () => {
    const err = new NotFoundError('Event', 'abc-123');
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('abc-123');
  });

  it('ValidationError includes details', () => {
    const err = new ValidationError('bad input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.toJSON()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'bad input',
        details: { field: 'email' },
      },
    });
  });
});
