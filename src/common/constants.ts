import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METRICS: Symbol('Metrics'),
  CLEANUP_REGISTRY: Symbol('CleanupRegistry'),
} satisfies Record<string, symbol>;
/* eslint-enable @typescript-eslint/naming-convention */

export const stubHealthCheck = async (): Promise<void> => Promise.resolve();

export const HEALTHCHECK = Symbol('Healthcheck');
export const ON_SIGNAL = Symbol('OnSignal');

export const X_API_KEY_HEADER = 'x-api-key';
