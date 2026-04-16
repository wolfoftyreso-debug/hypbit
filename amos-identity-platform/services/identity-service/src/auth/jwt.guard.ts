import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '@amos/utils';
import { AuthService } from './auth.service';

// Snapshot the env value ONCE at module load. An attacker who later
// manipulates process.env (via a dependency-injected exploit, a debug
// endpoint, or a hot-patch) cannot flip the guard into dev mode.
const DEV_MODE_AT_BOOT =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers['authorization'] ?? '';
    const token = typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    // Dev-only convenience token for the getting-started curl examples.
    // Gated on the boot-time env check, NOT a runtime read, so it cannot
    // be re-enabled in a running production process.
    if (DEV_MODE_AT_BOOT && token === 'dev-key') {
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
