import * as supertest from 'supertest';
import { Application } from 'express';
import { RemoteChangeKind } from '../../../../src/client/options';
import { MergeChangesRequestBody } from '../../../../src/change/controllers/changeController';
import { OsmXmlChange } from '../../../../src/change/models/change';
import { convertToXml } from '../../../../src/change/utils/xml';
import { InterpretAction } from '../../../../src/change/models/types';

export async function postMergeChanges(app: Application, body: MergeChangesRequestBody): Promise<supertest.Response> {
  return supertest.agent(app).post('/change/merge').set('Content-Type', 'application/json').send(body);
}

export async function postInterpretChange(app: Application, body: { osmChange: OsmXmlChange }): Promise<supertest.Response> {
  const xml = convertToXml(body);
  return supertest.agent(app).post('/change/interpret').set('Content-Type', 'application/xml').send(xml);
}

export async function getInterpretation(
  app: Application,
  changesetId: string,
  remote: RemoteChangeKind,
  action?: InterpretAction[]
): Promise<supertest.Response> {
  return supertest.agent(app).get(`/change/${changesetId}/interpret`).query({ remote, action });
}
