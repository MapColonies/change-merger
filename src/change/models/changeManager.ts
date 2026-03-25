import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { ConfigType } from '@src/common/config';
import { OsmElementType } from '@map-colonies/node-osm-elements';
import { SERVICES } from '../../common/constants';
import { convertToXml } from '../utils/xml';
import { mergeChanges } from './merger';
import { ChangeWithMetadata, ElementChange, OsmXmlChange, OsmXmlNode, OsmXmlTag, OsmXmlWay } from './change';
import { ACTION_KEY_MAP, IdMapping, InterpretAction, InterpretedMapping, InterpretResult } from './types';

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
    this.logger.info({ msg: 'started change interpretation', actions, externalIdTag: this.externalIdTag, lookupTags });

    const result: Partial<InterpretResult> = {};
    const lookupSet = lookupTags ? new Set(lookupTags) : undefined;

    for (const action of actions) {
      const key = ACTION_KEY_MAP[action];

      result[key] = [];

      const raw = change[action];
      if (!raw) {
        continue;
      }

      const elements = Array.isArray(raw) ? raw : [raw];
      result[key] = this.interpret(elements, lookupSet);
    }

    return result;
  }

  private interpret(wrappedElements: ElementChange[], lookupSet?: Set<string>): InterpretedMapping[] {
    const mapping: InterpretedMapping[] = [];

    for (const wrapped of wrappedElements) {
      if ('relation' in wrapped) {
        continue;
      }

      let type: OsmElementType;
      let elements: OsmXmlNode[] | OsmXmlWay[];

      if ('node' in wrapped) {
        type = 'node';
        elements = Array.isArray(wrapped.node) ? wrapped.node : [wrapped.node];
      } else if ('way' in wrapped) {
        type = 'way';
        elements = Array.isArray(wrapped.way) ? wrapped.way : [wrapped.way];
      } else {
        continue;
      }

      for (const element of elements) {
        const tags = Array.isArray(element.tag) ? element.tag : element.tag ? [element.tag] : [];

        let externalIdTag: OsmXmlTag | undefined;
        const foundTags: OsmXmlTag[] = [];

        for (const tag of tags) {
          if (tag.k === this.externalIdTag) {
            externalIdTag = tag;
          }
          if (lookupSet?.has(tag.k) === true) {
            foundTags.push(tag);
          }
        }

        if (!externalIdTag) {
          continue;
        }

        mapping.push({
          type,
          osmId: +element.id,
          externalId: externalIdTag.v,
          tags: foundTags.length > 0 ? foundTags : undefined,
        });
      }
    }

    return mapping;
  }
}
