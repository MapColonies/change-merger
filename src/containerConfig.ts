import { container } from 'tsyringe';
import config from 'config';
import { Metrics, getOtelMixin } from '@map-colonies/telemetry';
import { metrics } from '@opentelemetry/api-metrics';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { tracing } from './common/tracing';
import { Services } from './common/constants';

function registerExternalValues(): void {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });

  const tracer = trace.getTracer('change-merger');
  container.register(Services.TRACER, { useValue: tracer });

  const otelMetrics = new Metrics();
  otelMetrics.start();
  container.register(Services.METER, { useValue: metrics.getMeter('change-merger') });

  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.all([tracing.stop(), otelMetrics.stop()]);
    },
  });
}

export { registerExternalValues };
