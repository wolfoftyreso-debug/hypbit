import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

export async function requestIdPlugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : uuidv4();
    (request as unknown as { requestId: string }).requestId = id;
    reply.header('x-request-id', id);
  });
}
