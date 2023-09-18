import { inject, injectable } from 'tsyringe';
import client from 'prom-client';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES, METRICS_REGISTRY } from '../../common/constants';
import { changeToXml } from '../utils/jsonChangeToXml';
import { mergeChanges } from './merger';
import { IdMapping, ChangeWithMetadata } from './types';

@injectable()
export class ChangeManager {
  private readonly changeCounter: client.Counter<'status' | 'changesetid'>;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(METRICS_REGISTRY) registry: client.Registry) {
    this.changeCounter = new client.Counter({
      name: 'change_count',
      help: 'The overall change stats',
      labelNames: ['status', 'changesetid'] as const,
      registers: [registry],
    });
  }

  public mergeChanges(changes: ChangeWithMetadata[], changesetId: number): [string, IdMapping[], string[]] {
    this.logger.info({ msg: 'started changes merging', count: changes.length });

    this.changeCounter.inc({ status: 'overall', changesetid: changesetId }, changes.length);

    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    this.changeCounter.inc({ status: 'create', changesetid: changesetId }, idsToCreate.length);
    this.changeCounter.inc({ status: 'delete', changesetid: changesetId }, idsToCreate.length);
    return [changeToXml({ osmChange: change }), idsToCreate, idsToDelete];
  }
}
