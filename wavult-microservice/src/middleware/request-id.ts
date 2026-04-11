import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';

async function plugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : uuidv4();
    (request as unknown as { requestId: string }).requestId = id;
    void reply.header('x-request-id', id);
  });
}

// fastify-plugin strips the encapsulation boundary so the hook applies to
// routes registered at the parent (root) scope as well.
export const requestIdPlugin = fp(plugin, { name: 'request-id' });
