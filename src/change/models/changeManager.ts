import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { changeToXml } from '../utils/jsonChangeToXml';
import { mergeChanges } from './merger';
import { IdMapping, ChangeWithMetadata } from './types';

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public mergeChanges(changes: ChangeWithMetadata[], changesetId: number): [string, IdMapping[], string[]] {
    this.logger.log('info', `merging ${changes.length} changes`);
    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    return [changeToXml({ osmChange: change }), idsToCreate, idsToDelete];
  }
}
