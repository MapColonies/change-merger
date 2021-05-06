import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ChangeManager } from '../models/changeManager';
import { ChangeWithMetadata, IdMapping } from '../models/types';

interface ResponseChangeObject {
  change: string;
  created: IdMapping[];
  deleted: string[];
}

type MergeChangesHandler = RequestHandler<undefined, ResponseChangeObject, MergeChangesRequestBody>;

export interface MergeChangesRequestBody {
  changesetId: number;
  changes: ChangeWithMetadata[];
}

@injectable()
export class ChangeController {
  public constructor(@inject(Services.LOGGER) private readonly logger: Logger, @inject(ChangeManager) private readonly manager: ChangeManager) {}

  public mergeChanges: MergeChangesHandler = (req, res) => {
    const [change, created, deleted] = this.manager.mergeChanges(req.body.changes, req.body.changesetId);
    return res.status(httpStatus.OK).json({ change, created, deleted });
  };
}
