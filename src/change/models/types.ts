import { OsmXmlTag } from './change';

type OsmElementType = 'node' | 'way' | 'relation';

export interface IdMapping {
  externalId: string;
  tempOsmId: number;
}

export interface MergeResult {
  change: string;
  created: IdMapping[];
  deleted: string[];
}

export type InterpretAction = 'create' | 'modify' | 'delete';

export interface InterpretedMapping {
  type: OsmElementType;
  externalId: string;
  osmId: number;
  tags?: OsmXmlTag[];
}

export interface InterpretResult {
  created: InterpretedMapping[];
  modified: InterpretedMapping[];
  deleted: InterpretedMapping[];
}
