import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { RemoteChangeKind } from '@src/client/options';
import { ChangeClient } from '@src/client';
import { SERVICES } from '../../common/constants';
import { ChangeManager } from '../models/changeManager';
import { InterpretAction, InterpretResult, MergeResult } from '../models/types';
import { ChangeWithMetadata, OsmXmlChange } from '../models/change';

type MergeChangesHandler = RequestHandler<undefined, MergeResult, MergeChangesRequestBody>;
type InterpretChangeHandler = RequestHandler<undefined, InterpretResult, { osmChange: OsmXmlChange }>;
type GetChangeInterpretation = RequestHandler<
  { changesetId: string },
  Partial<InterpretResult>,
  undefined,
  { remote: RemoteChangeKind; action?: InterpretAction[] }
>;

export interface MergeChangesRequestBody {
  changesetId: number;
  changes: ChangeWithMetadata[];
}

@injectable()
export class ChangeController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ChangeManager) private readonly manager: ChangeManager,
    @inject(ChangeClient) private readonly client: InstanceType<typeof ChangeClient>
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
      const result = this.manager.interpretChange(req.body.osmChange) as Required<InterpretResult>;
      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public getChangeInterpretation: GetChangeInterpretation = async (req, res, next) => {
    try {
      const { changesetId } = req.params;
      const { remote, action: actions } = req.query;

      const osmChange = await this.client.downloadChange(remote, changesetId);

      const result = this.manager.interpretChange(osmChange, actions);

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
