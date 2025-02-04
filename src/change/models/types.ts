export interface IdMapping {
  externalId: string;
  tempOsmId: number;
}

export interface MergeResult {
  change: string;
  created: IdMapping[];
  deleted: string[];
}

export interface InterpretedMapping {
  externalId: string;
  osmId: number;
}

export interface InterpretResult {
  created: InterpretedMapping[];
  deleted: InterpretedMapping[];
}
