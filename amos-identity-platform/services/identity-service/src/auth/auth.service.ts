import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { signJwt, verifyJwt, JwtPayload } from '@amos/crypto';

@Injectable()
export class AuthService {
  constructor(private readonly config: ConfigService) {}

  issueUploadToken(sessionId: string, ttlSeconds = 900): string {
    return signJwt(
      { sub: sessionId, sessionId, scope: ['upload'] },
      {
        secret: this.config.get<string>('identity.crypto.jwtSecret') ?? 'dev',
        issuer: this.config.get<string>('identity.crypto.jwtIssuer') ?? 'amos-identity',
        audience: this.config.get<string>('identity.crypto.jwtAudience') ?? 'amos-external',
      },
      ttlSeconds,
    );
  }

  verify(token: string): JwtPayload {
    return verifyJwt(token, {
      secret: this.config.get<string>('identity.crypto.jwtSecret') ?? 'dev',
      issuer: this.config.get<string>('identity.crypto.jwtIssuer') ?? 'amos-identity',
      audience: this.config.get<string>('identity.crypto.jwtAudience') ?? 'amos-external',
    });
  }
}
