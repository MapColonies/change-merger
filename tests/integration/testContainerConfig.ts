import { trace } from '@opentelemetry/api';
import { metrics } from '@opentelemetry/api-metrics';
import { container } from 'tsyringe';
import config from 'config';
import jsLogger from '@map-colonies/js-logger';
import { Services } from '../../src/common/constants';

function registerTestValues(): void {
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: jsLogger({ enabled: false }) });

  container.register(Services.TRACER, { useValue: trace.getTracer('test') });

  container.register(Services.METER, { useValue: metrics.getMeter('test') });
}

export { registerTestValues };
