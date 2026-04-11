import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { config } from '../config';
import { logger } from '../logger';

let sdk: NodeSDK | null = null;

export function startTracing(): void {
  if (!config.OTEL_ENABLED) {
    logger.info('OpenTelemetry tracing disabled');
    return;
  }

  const exporter = new OTLPTraceExporter({
    url: config.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${config.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
      : undefined,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.SERVICE_VERSION,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.NODE_ENV,
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
  logger.info({ endpoint: config.OTEL_EXPORTER_OTLP_ENDPOINT }, 'OpenTelemetry tracing started');
}

export async function stopTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    logger.info('OpenTelemetry tracing stopped');
  }
}
