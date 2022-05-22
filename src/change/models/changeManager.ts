import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { changeToXml } from '../utils/jsonChangeToXml';
import { mergeChanges } from './merger';
import { IdMapping, ChangeWithMetadata } from './types';

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: Logger) { }

  public mergeChanges(changes: ChangeWithMetadata[], changesetId: number): [string, IdMapping[], string[]] {
    this.logger.info({ msg: 'started changes merging', amount: changes.length });

    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    return [changeToXml({ osmChange: change }), idsToCreate, idsToDelete];
  }
}
