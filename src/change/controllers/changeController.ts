import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { ChangeManager } from '../models/changeManager';
import { InterpretResult, MergeResult } from '../models/types';
import { ChangeWithMetadata, OsmXmlChange } from '../models/change';

type MergeChangesHandler = RequestHandler<undefined, MergeResult, MergeChangesRequestBody>;

type InterpretChangeHandler = RequestHandler<undefined, InterpretResult, { osmChange: OsmXmlChange }>;

export interface MergeChangesRequestBody {
  changesetId: number;
  changes: ChangeWithMetadata[];
}

@injectable()
export class ChangeController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ChangeManager) private readonly manager: ChangeManager
  ) {}

  public mergeChanges: MergeChangesHandler = (req, res, next) => {
    try {
      const [change, created, deleted] = this.manager.mergeChanges(req.body.changes, req.body.changesetId);
      return res.status(httpStatus.OK).json({ change, created, deleted });
    } catch (error) {
      return next(error);
    }
  };

  public interpretChange: InterpretChangeHandler = (req, res, next) => {
    try {
      const result = this.manager.interpretChange(req.body.osmChange);
      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
