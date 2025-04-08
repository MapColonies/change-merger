import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { AxiosInstance } from 'axios';
import { ConfigType } from '@src/common/config';
import { IApp } from '@src/common/interfaces';
import { OsmXmlChange } from '@src/change/models/change';
import { convertFromXml } from '@src/change/utils/xml';
import { SERVICES } from '@src/common/constants';
import { formatChangesetId, unzipAsync } from '@src/change/utils';
import { clientFactory } from './factory';
import { RemoteChangeKind } from './options';

export interface IChangeClient {
  downloadChange: (remote: RemoteChangeKind, changesetId: string) => Promise<OsmXmlChange>;
}

@injectable()
export class ChangeClient {
  private readonly apiClient: AxiosInstance;
  private readonly replicationClient: AxiosInstance;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: ConfigType
  ) {
    const { remote: remoteConfig } = this.config.get('app') as IApp;
    this.apiClient = clientFactory(remoteConfig.api);
    this.replicationClient = clientFactory(remoteConfig.replication);

    this.logger.info({ msg: 'initialized changeset client', remoteConf: remoteConfig });
  }

  public async downloadChange(remote: RemoteChangeKind, changesetId: string): Promise<OsmXmlChange> {
    this.logger.info({ msg: 'executing change download', remote, changesetId });

    let change;

    if (remote === 'replication') {
      const formattedChangesetId = formatChangesetId(changesetId);

      const response = await this.replicationClient.get<ArrayBuffer>(`${formattedChangesetId}.osc.gz`, { responseType: 'arraybuffer' });

      const unzippedBuffer = await unzipAsync(response.data);

      change = unzippedBuffer.toString();
    } else {
      const response = await this.apiClient.get<string>(`changeset/${changesetId}/download`, {
        headers: { ['Accept']: 'application/xml' },
      });

      change = response.data;
    }

    const xml = convertFromXml<{ osmChange: OsmXmlChange }>(change);

    return xml.osmChange;
  }
}
