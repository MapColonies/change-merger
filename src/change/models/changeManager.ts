import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';
import { changeToXml } from '../utils/jsonChangeToXml';
import { mergeChanges } from './merger';
import { RequestChangeObject, ResponseChangeObject } from './types';

@injectable()
export class ChangeManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public mergeChanges(changes: RequestChangeObject[], changesetId: number): ResponseChangeObject {
    this.logger.log('info', `merging ${changes.length} changes`);
    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    return { change: changeToXml({ osmChange: change }), created: idsToCreate, deleted: idsToDelete };
  }
}
