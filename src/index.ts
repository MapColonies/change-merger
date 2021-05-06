// this import must be called before the first import of tsyring
import 'reflect-metadata';
import './common/tracing';
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
createTerminus(app, { healthChecks: { '/liveness': true }, onSignal: container.resolve('onSignal') });

app.listen(port, () => {
  logger.info(`app started on port ${port}`);
});
