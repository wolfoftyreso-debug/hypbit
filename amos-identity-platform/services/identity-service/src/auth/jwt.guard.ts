import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '@amos/utils';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    // Dev mode: accept "dev-key" for the getting-started curl examples.
    if (process.env.NODE_ENV !== 'production' && token === 'dev-key') {
      req.user = { sub: 'dev', scope: ['upload', 'verify'] };
      return true;
    }

    if (!token) throw new UnauthorizedError('missing bearer token');

    try {
      req.user = this.auth.verify(token);
      return true;
    } catch {
      throw new UnauthorizedError('invalid token');
    }
  }
}
