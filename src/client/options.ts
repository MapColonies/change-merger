export type RemoteChangeKind = 'api' | 'replication';

export interface RemoteOptions {
  baseUrl: string;
  timeoutMs: number;
  xApiKey?: string;
  auth?: {
    username: string;
    password: string;
  };
}
