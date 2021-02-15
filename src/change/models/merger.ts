import { BaseElement, OsmNode, OsmWay } from '@map-colonies/node-osm-elements';
import { SERVICE_NAME } from '../../common/constants';
import { IdGenerator } from '../utils/idGenerator';
import { createOsmXmlNode, createOsmXmlWay } from './generators';
import { IdMapping, ChangeWithMetadata, OsmXmlChange, OsmXmlNode, OsmXmlWay } from './types';

const isNode = (element: BaseElement): element is OsmNode => element.type === 'node';
const isWay = (element: BaseElement): element is OsmWay => element.type === 'way';

const handleChangeArray = (
  elements: BaseElement[],
  idGenerator: IdGenerator,
  tempMapping: Map<number, number>,
  changesetId: number
): [OsmXmlNode[], OsmXmlWay?] => {
  const nodes: OsmXmlNode[] = [];
  let osmWay: OsmWay | null = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.id < 0) {
      const newId = idGenerator.getId();
      tempMapping.set(element.id, newId);
      element.id = newId;
    }

    if (isNode(element)) {
      nodes.push(createOsmXmlNode(element, changesetId));
    } else if (isWay(element)) {
      osmWay = element;
    }
  }

  let xmlWay: OsmXmlWay | undefined = undefined;
  if (osmWay) {
    xmlWay = createOsmXmlWay(osmWay, tempMapping, changesetId);
  }
  return [nodes, xmlWay];
};

const handleChangeObj = (changeObj: ChangeWithMetadata, idGenerator: IdGenerator, change: OsmXmlChange, changesetId: number): number => {
  const tempMapping = new Map<number, number>();

  const actions: typeof changeObj.action[] = ['create', 'modify', 'delete'];

  actions.forEach((action) => {
    const elementArr = changeObj.change[action];
    if (elementArr) {
      const [nodes, way] = handleChangeArray(elementArr, idGenerator, tempMapping, changesetId);
      change[action].node.push(...nodes);
      if (way) {
        change[action].way.push(way);
      }
    }
  });

  return changeObj.tempOsmId !== undefined ? (tempMapping.get(changeObj.tempOsmId) as number) : 0;
};

const mergeChanges = (changes: ChangeWithMetadata[], changesetId: number): [OsmXmlChange, IdMapping[], string[]] => {
  const idGenerator = new IdGenerator();
  const change: OsmXmlChange = {
    generator: SERVICE_NAME,
    version: '0.6',
    create: { node: [], way: [] },
    modify: { node: [], way: [] },
    delete: { way: [], node: [] },
  };
  const idsToAdd: IdMapping[] = [];
  const idsToDelete: string[] = [];

  for (let i = 0; i < changes.length; i++) {
    const changeObj = changes[i];
    const tempOsmId = handleChangeObj(changeObj, idGenerator, change, changesetId);

    if (changeObj.action === 'create') {
      idsToAdd.push({ tempOsmId, externalId: changeObj.externalId });
    }

    if (changeObj.action === 'delete') {
      idsToDelete.push(changeObj.externalId);
    }
  }

  return [change, idsToAdd, idsToDelete];
};

export { mergeChanges };
