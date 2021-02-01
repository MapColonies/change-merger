import { BaseElement, OsmNode, OsmWay } from '@map-colonies/node-osm-elements';
import { IdGenerator } from '../utils/idGenerator';
import { createOsmXmlNode, createOsmXmlWay } from './creators';
import { IdMapping, RequestChangeObject, OsmXmlChange, OsmXmlNode, OsmXmlWay } from './types';

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

const handleChangeObj = (incomingChangeObj: RequestChangeObject, idGenerator: IdGenerator, change: OsmXmlChange, changesetId: number): number => {
  const tempMapping = new Map<number, number>();

  const actions: typeof incomingChangeObj.action[] = ['create', 'modify', 'delete'];

  actions.forEach((action) => {
    const elementArr = incomingChangeObj.change[action];
    if (elementArr) {
      const [nodes, way] = handleChangeArray(elementArr, idGenerator, tempMapping, changesetId);
      change[action].node.push(...nodes);
      if (way) {
        change[action].way.push(way);
      }
    }
  });

  return incomingChangeObj.tempOsmId !== undefined ? (tempMapping.get(incomingChangeObj.tempOsmId) as number) : 0;
};

const mergeChanges = (changes: RequestChangeObject[], changesetId: number): [OsmXmlChange, IdMapping[], string[]] => {
  const idGenerator = new IdGenerator();
  const change: OsmXmlChange = {
    generator: 'change-merger',
    version: '0.6',
    create: { node: [], way: [] },
    modify: { node: [], way: [] },
    delete: { node: [], way: [] },
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
