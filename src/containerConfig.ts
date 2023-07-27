import config from 'config';
import { Metrics, getOtelMixin } from '@map-colonies/telemetry';
import { metrics } from '@opentelemetry/api-metrics';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { tracing } from './common/tracing';
import { Services } from './common/constants';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { CHANGE_ROUTER_SYMBOL, changeRouterFactory } from './change/routes/changeRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const tracer = trace.getTracer('change-merger');
  const otelMetrics = new Metrics();
  otelMetrics.start();

  const dependencies: InjectionObject<unknown>[] = [
    { token: Services.CONFIG, provider: { useValue: config } },
    { token: Services.LOGGER, provider: { useValue: logger } },
    { token: Services.TRACER, provider: { useValue: tracer } },
    { token: Services.METER, provider: { useValue: metrics.getMeter('change-merger') } },
    { token: CHANGE_ROUTER_SYMBOL, provider: { useFactory: changeRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop(), otelMetrics.stop()]);
          },
        },
      },
    },
  ];
  return registerDependencies(dependencies, options?.override, options?.useChild);
};
