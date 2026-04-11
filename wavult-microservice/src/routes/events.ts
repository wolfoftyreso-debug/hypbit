import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createEvent, getEventById } from '../services/event-service';
import { ValidationError } from '../errors';

const EventInputSchema = z.object({
  type: z.string().min(1).max(256),
  source: z.string().min(1).max(256),
  subject: z.string().max(256).optional(),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export async function eventRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/events', async (request, reply) => {
    const parsed = EventInputSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid event payload', parsed.error.flatten());
    }
    const event = await createEvent(parsed.data);
    return reply.status(201).send({ event });
  });

  app.get<{ Params: { id: string } }>('/v1/events/:id', async (request) => {
    const event = await getEventById(request.params.id);
    return { event };
  });
}
