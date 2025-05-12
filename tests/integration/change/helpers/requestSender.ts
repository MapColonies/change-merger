import * as supertest from 'supertest';
import { Application } from 'express';
import { RemoteChangeKind } from '../../../../src/client/options';
import { MergeChangesRequestBody } from '../../../../src/change/controllers/changeController';
import { OsmXmlChange } from '../../../../src/change/models/change';
import { convertToXml } from '../../../../src/change/utils/xml';
import { InterpretAction } from '../../../../src/change/models/types';

export class ChangeRequestSender {
  public constructor(private readonly app: Application) {}

  public async postMergeChanges(body: MergeChangesRequestBody): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/change/merge').set('Content-Type', 'application/json').send(body);
  }

  public async postInterpretChange(body: { osmChange: OsmXmlChange }): Promise<supertest.Response> {
    const xml = convertToXml(body);
    return supertest.agent(this.app).post('/change/interpret').set('Content-Type', 'application/xml').send(xml);
  }

  public async getInterpretation(changesetId: string, remote: RemoteChangeKind, action?: InterpretAction[]): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/change/${changesetId}/interpret`).query({ remote, action });
  }
}
