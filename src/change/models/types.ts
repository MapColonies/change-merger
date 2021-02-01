import { OsmChange } from '@map-colonies/node-osm-elements';

interface OsmXmlTag {
  k: string;
  v: string;
}

interface OsmXmlBase {
  id: number;
  version: number;
  changeset: number;
  tag: OsmXmlTag[];
}

interface OsmXmlNode extends OsmXmlBase {
  lon: number;
  lat: number;
}

interface OsmXmlWay extends OsmXmlBase {
  nd: { ref: number }[];
}

interface ChangeActionObj {
  node: OsmXmlNode[];
  way: OsmXmlWay[];
}

export interface OsmXmlChange {
  version: '0.6';
  generator: 'change-merger';
  create: ChangeActionObj;
  modify: ChangeActionObj;
  delete: ChangeActionObj;
}
export interface IdMapping {
  externalId: string;
  tempOsmId: number;
}

export interface RequestChangeObject {
  externalId: string;
  change: OsmChange;
  tempOsmId?: number;
  action: 'create' | 'modify' | 'delete';
}

export interface ResponseChangeObject {
  change: string;
  created: IdMapping[];
  deleted: string[];
}

export { OsmXmlNode, OsmXmlWay, OsmXmlTag };
