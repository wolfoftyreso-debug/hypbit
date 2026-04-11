import { FastifyError, FastifyInstance } from 'fastify';
import { AppError, InternalError } from '../errors';
import { logger } from '../logger';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      logger.warn(
        { err: error, code: error.code, path: request.url, requestId: reply.getHeader('x-request-id') },
        'app error',
      );
      return reply.status(error.statusCode).send(error.toJSON());
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.validation,
        },
      });
    }

    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    logger.error({ err: error, path: request.url }, 'unhandled error');
    const wrapped = new InternalError(status >= 500 ? 'Internal server error' : error.message);
    return reply.status(status).send(wrapped.toJSON());
  });

  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });
}
