import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ConfigType } from '@src/common/config';
import { SERVICES } from '../../common/constants';
import { convertToXml } from '../utils/jsonToXml';
import { mergeChanges } from './merger';
import { ChangeWithMetadata, ElementChange, OsmXmlChange } from './change';
import { IdMapping, InterpretedMapping, InterpretResult } from './types';

@injectable()
export class ChangeManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: ConfigType
  ) {}

  public mergeChanges(changes: ChangeWithMetadata[], changesetId: number): [string, IdMapping[], string[]] {
    this.logger.info({ msg: 'started changes merging', count: changes.length });

    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    return [convertToXml({ osmChange: change }), idsToCreate, idsToDelete];
  }

  public interpretChange(change: OsmXmlChange): InterpretResult {
    this.logger.info({ msg: 'started change interpret' });

    // due to xml parsing convertion possibly converting a single item array to just the item, we'll safely check beforehand
    const created = change.create ? (Array.isArray(change.create) ? this.interpret(change.create) : this.interpret([change.create])) : [];
    const deleted = change.delete ? (Array.isArray(change.delete) ? this.interpret(change.delete) : this.interpret([change.delete])) : [];

    return { created, deleted };
  }

  private interpret(elements: ElementChange[]): InterpretedMapping[] {
    const mapping: InterpretedMapping[] = [];

    elements.forEach((wrappedElement) => {
      // skip relations
      if ('relation' in wrappedElement) {
        return;
      }

      // determine if node or way
      const element = 'node' in wrappedElement ? wrappedElement.node : wrappedElement.way;

      // skip element with no tags
      if (element.tag === undefined) {
        return;
      }

      // if found, add to mapping the osmId, externalId pair
      const tags = Array.isArray(element.tag) ? element.tag : [element.tag];
      const externalIdTag = tags.find((tag) => tag.k === this.config.get('app.externalIdTag'));
      if (externalIdTag) {
        mapping.push({ osmId: element.id, externalId: externalIdTag.v });
      }
    });

    return mapping;
  }
}
