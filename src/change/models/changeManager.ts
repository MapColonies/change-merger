import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ConfigType } from '@src/common/config';
import { OsmElementType } from '@map-colonies/node-osm-elements';
import { SERVICES } from '../../common/constants';
import { convertToXml } from '../utils/xml';
import { mergeChanges } from './merger';
import { ChangeWithMetadata, ElementChange, OsmXmlChange, OsmXmlNode, OsmXmlWay } from './change';
import { IdMapping, InterpretAction, InterpretedMapping, InterpretResult } from './types';

@injectable()
export class ChangeManager {
  private readonly externalIdTag: string;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: ConfigType
  ) {
    this.externalIdTag = this.config.get('app.externalIdTag') as string;
  }

  public mergeChanges(changes: ChangeWithMetadata[], changesetId: number): [string, IdMapping[], string[]] {
    this.logger.info({ msg: 'started changes merging', count: changes.length });

    const [change, idsToCreate, idsToDelete] = mergeChanges(changes, changesetId);
    return [convertToXml({ osmChange: change }), idsToCreate, idsToDelete];
  }

  public interpretChange(change: OsmXmlChange, actions: InterpretAction[] = ['create', 'delete'], lookupTags?: string[]): Partial<InterpretResult> {
    this.logger.info({ msg: 'started change interpretation', actions, extenralIdTag: this.externalIdTag, lookupTags });

    const result = actions.reduce((acc, action) => {
      const raw = change[action];
      const interpreted = raw ? (Array.isArray(raw) ? this.interpret(raw, lookupTags) : this.interpret([raw], lookupTags)) : [];

      const actionResult = action === 'create' ? 'created' : action === 'modify' ? 'modified' : 'deleted';
      acc[actionResult] = interpreted;
      return acc;
    }, {} as Partial<InterpretResult>);

    return result;
  }

  private interpret(elements: ElementChange[], lookupTags?: string[]): InterpretedMapping[] {
    const mapping: InterpretedMapping[] = [];

    elements.forEach((wrappedElements) => {
      // skip relations
      if ('relation' in wrappedElements) {
        return;
      }

      let type: OsmElementType;
      let elements: OsmXmlNode[] | OsmXmlWay[] = [];

      // determine if node or way
      if ('node' in wrappedElements) {
        type = 'node';
        elements = Array.isArray(wrappedElements.node) ? wrappedElements.node : [wrappedElements.node];
      }
      if ('way' in wrappedElements) {
        type = 'way';
        elements = Array.isArray(wrappedElements.way) ? wrappedElements.way : [wrappedElements.way];
      }

      elements.forEach((element) => {
        const tags = Array.isArray(element.tag) ? element.tag : element.tag ? [element.tag] : [];
        const externalIdTag = tags.find((tag) => tag.k === this.externalIdTag);

        if (externalIdTag) {
          const foundTags = tags.filter((tag) => lookupTags?.includes(tag.k));

          mapping.push({
            type,
            osmId: +element.id,
            externalId: externalIdTag.v,
            tags: foundTags.length !== 0 ? foundTags : undefined,
          });
        }
      });
    });

    return mapping;
  }
}
