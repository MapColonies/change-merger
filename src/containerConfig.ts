import { container } from 'tsyringe';
import config from 'config';
import { logMethod, Metrics } from '@map-colonies/telemetry';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { tracing } from './common/tracing';
import { Services } from './common/constants';

function registerExternalValues(): void {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });

  tracing.start();
  const tracer = trace.getTracer('change-merger');
  container.register(Services.TRACER, { useValue: tracer });

  const metrics = new Metrics('change-merger');
  const meter = metrics.start();
  container.register(Services.METER, { useValue: meter });

  container.register('onSignal', {
    useValue: async (): Promise<void> => {
      await Promise.all([tracing.stop(), metrics.stop()]);
    },
  });
}

export { registerExternalValues };
