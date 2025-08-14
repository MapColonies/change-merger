import { RemoteChangeKind, RemoteOptions } from '@src/client/options';

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IApp {
  externalIdTag: string;
  remote: {
    [key in RemoteChangeKind]: RemoteOptions;
  };
}
