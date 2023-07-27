import { Logger } from '@map-colonies/js-logger';
import { Meter } from '@opentelemetry/api';
import { BoundCounter } from '@opentelemetry/api-metrics';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
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
  private readonly createdResourceCounter: BoundCounter;
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ChangeManager) private readonly manager: ChangeManager,
    @inject(SERVICES.METER) private readonly meter: Meter
  ) {
    this.createdResourceCounter = meter.createCounter('created_resource');
  }

  public mergeChanges: MergeChangesHandler = (req, res) => {
    const [change, created, deleted] = this.manager.mergeChanges(req.body.changes, req.body.changesetId);
    return res.status(httpStatus.OK).json({ change, created, deleted });
  };
}
