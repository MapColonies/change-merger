import { OsmChange } from '@map-colonies/node-osm-elements';

interface OsmXmlBase {
  id: number;
  version: number;
  changeset: number;
  tag?: OsmXmlTag | OsmXmlTag[];
}

interface ChangeActionObj {
  node: OsmXmlNode[];
  way: OsmXmlWay[];
}

interface NodeChange {
  node: OsmXmlNode;
}

interface WayChange {
  way: OsmXmlWay;
}

interface RelationChange {
  relation: unknown;
}

export interface OsmXmlTag {
  k: string;
  v: string;
}

export interface OsmXmlNode extends OsmXmlBase {
  lon: number;
  lat: number;
}

export interface OsmXmlWay extends OsmXmlBase {
  nd: { ref: number }[];
}

export type ElementChange = NodeChange | WayChange | RelationChange;

export interface ChangeWithMetadata {
  externalId: string;
  change: OsmChange;
  tempOsmId?: number;
  action: 'create' | 'modify' | 'delete';
}

export interface MergedOsmXmlChange {
  version: '0.6';
  generator: string;
  create: ChangeActionObj;
  modify: ChangeActionObj;
  delete: ChangeActionObj;
}

export interface OsmXmlChange {
  version: '0.6';
  generator: string;
  create?: ElementChange | ElementChange[];
  modify?: ElementChange | ElementChange[];
  delete?: ElementChange | ElementChange[];
}
