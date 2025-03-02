import express, { Router } from 'express';
import bodyParser from 'body-parser';
import bodyParserXml from 'body-parser-xml';
import compression from 'compression';
import { getErrorHandlerMiddleware } from '@map-colonies/error-express-handler';
import { OpenapiViewerRouter } from '@map-colonies/openapi-express-viewer';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import httpLogger from '@map-colonies/express-access-log-middleware';
import { getTraceContexHeaderMiddleware } from '@map-colonies/telemetry';
import { Registry } from 'prom-client';
import { collectMetricsExpressMiddleware } from '@map-colonies/telemetry/prom-metrics';
import { SERVICES } from './common/constants';
import { CHANGE_ROUTER_SYMBOL } from './change/routes/changeRouter';
import { ConfigType } from './common/config';

@injectable()
export class ServerBuilder {
  private readonly serverInstance: express.Application;

  public constructor(
    @inject(SERVICES.CONFIG) private readonly config: ConfigType,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry,
    @inject(CHANGE_ROUTER_SYMBOL) private readonly changeRouter: Router
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildDocsRoutes(): void {
    const openapiConfig = this.config.get('openapiConfig');
    const openapiRouter = new OpenapiViewerRouter({
      ...openapiConfig,
      filePathOrSpec: openapiConfig.filePath,
    });
    openapiRouter.setup();
    this.serverInstance.use(openapiConfig.basePath, openapiRouter.getRouter());
  }

  private buildRoutes(): void {
    this.serverInstance.use('/change', this.changeRouter);
    this.buildDocsRoutes();
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(collectMetricsExpressMiddleware({ registry: this.metricsRegistry }));
    this.serverInstance.use(httpLogger({ logger: this.logger, ignorePaths: ['/metrics'] }));

    if (this.config.get('server.response.compression.enabled')) {
      this.serverInstance.use(compression(this.config.get('server.response.compression.options') as unknown as compression.CompressionFilter));
    }

    const bodyParserOptions = this.config.get('server.request.payload');

    bodyParserXml(bodyParser);

    this.serverInstance.use(bodyParser.json(bodyParserOptions));
    this.serverInstance.use(
      bodyParser.xml({ ...bodyParserOptions, type: 'application/xml', xmlParseOptions: { explicitArray: false, mergeAttrs: true, trim: true } })
    );

    this.serverInstance.use(getTraceContexHeaderMiddleware());

    const ignorePathRegex = new RegExp(`^${this.config.get('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get('openapiConfig.filePath');
    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(getErrorHandlerMiddleware());
  }
}
