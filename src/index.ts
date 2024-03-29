// this import must be called before the first import of tsyring
import 'reflect-metadata';
import './common/tracing';
import { createServer } from 'http';
import { container } from 'tsyringe';
import { get } from 'config';
import { Logger } from '@map-colonies/js-logger';
import { createTerminus } from '@godaddy/terminus';
import { getApp } from './app';
import { DEFAULT_SERVER_PORT, Services } from './common/constants';
import { IServerConfig } from './common/interfaces';

const serverConfig = get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;
const app = getApp();

const logger = container.resolve<Logger>(Services.LOGGER);
const stubHealthcheck = async (): Promise<void> => Promise.resolve();
// eslint-disable-next-line @typescript-eslint/naming-convention
const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthcheck }, onSignal: container.resolve('onSignal') });

server.listen(port, () => {
  logger.info(`app started on port ${port}`);
});
