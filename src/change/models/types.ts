import { OsmChange } from '@map-colonies/node-osm-elements';

interface IdMapping {
  externalId: string;
  tempOsmId: number;
}

interface OsmXmlTag {
  k: string;
  v: string;
}

interface ChangeWithMetadata {
  externalId: string;
  change: OsmChange;
  tempOsmId?: number;
  action: 'create' | 'modify' | 'delete';
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

 interface OsmXmlChange {
  version: '0.6';
  generator: string;
  create: ChangeActionObj;
  modify: ChangeActionObj;
  delete: ChangeActionObj;
}


export { OsmXmlNode, OsmXmlWay, OsmXmlTag, OsmXmlChange, ChangeWithMetadata, IdMapping };
