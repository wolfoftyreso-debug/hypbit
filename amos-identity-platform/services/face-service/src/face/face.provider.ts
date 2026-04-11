import { Injectable } from '@nestjs/common';
import { CompreFaceProvider, FaceProvider, MockFaceProvider } from '@amos/face';

@Injectable()
export class FaceProviderFactory {
  private readonly provider: FaceProvider;

  constructor() {
    if (process.env.NODE_ENV === 'test' || process.env.FACE_MOCK === 'true') {
      this.provider = new MockFaceProvider();
    } else {
      this.provider = new CompreFaceProvider({
        url: process.env.COMPREFACE_URL ?? 'http://compreface-api:8080',
        apiKey: process.env.COMPREFACE_API_KEY ?? '',
        matchThreshold: Number(process.env.FACE_MATCH_THRESHOLD ?? 0.8),
      });
    }
  }

  get(): FaceProvider {
    return this.provider;
  }
}
