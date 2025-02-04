import { OsmNode, OsmWay } from '@map-colonies/node-osm-elements';
import { OsmXmlNode, OsmXmlTag, OsmXmlWay } from './change';

const createOsmXmlTag = (oldTags?: Record<string, string>): OsmXmlTag[] => {
  if (!oldTags) {
    return [];
  }
  return Object.entries(oldTags).map(([k, v]) => ({ k, v }));
};

const createOsmXmlNode = (osmNode: OsmNode, changesetId: number): OsmXmlNode => {
  const { type, tags, ...node } = osmNode as Required<OsmNode>;
  return { ...node, changeset: changesetId, tag: createOsmXmlTag(tags) };
};

const createOsmXmlWay = (osmWay: OsmWay, tempMapping: Map<number, number>, changesetId: number): OsmXmlWay => {
  const { tags, nodes, type, ...rest } = osmWay as Required<OsmWay>;
  return {
    ...rest,
    changeset: changesetId,
    nd: nodes.map((node) => ({ ref: tempMapping.get(node.id) ?? node.id })),
    tag: createOsmXmlTag(tags),
  };
};

export { createOsmXmlNode, createOsmXmlWay, createOsmXmlTag };
