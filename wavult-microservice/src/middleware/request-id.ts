import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';

// Allow-list for request id chars: letters, digits, dash, underscore and
// colon (common tracing formats like `trace-id:span-id`). Anything else —
// including CR/LF — is rejected and replaced with a fresh UUID. This
// prevents log injection and HTTP response header smuggling via the
// x-request-id header.
const SAFE_REQUEST_ID = /^[A-Za-z0-9_:-]{1,128}$/;

function sanitize(id: unknown): string {
  if (typeof id !== 'string') return uuidv4();
  if (!SAFE_REQUEST_ID.test(id)) return uuidv4();
  return id;
}

async function plugin(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request, reply) => {
    const id = sanitize(request.headers['x-request-id']);
    (request as unknown as { requestId: string }).requestId = id;
    void reply.header('x-request-id', id);
  });
}

// fastify-plugin strips the encapsulation boundary so the hook applies to
// routes registered at the parent (root) scope as well.
export const requestIdPlugin = fp(plugin, { name: 'request-id' });
