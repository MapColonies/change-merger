import * as supertest from 'supertest';
import { Application } from 'express';
import { MergeChangesRequestBody } from '../../../../src/change/controllers/changeController';
import { OsmXmlChange } from '../../../../src/change/models/change';
import { convertToXml } from '../../../../src/change/utils/jsonToXml';

export async function postMergeChanges(app: Application, body: MergeChangesRequestBody): Promise<supertest.Response> {
  return supertest.agent(app).post('/change/merge').set('Content-Type', 'application/json').send(body);
}

export async function postInterpretChange(app: Application, body: { osmChange: OsmXmlChange }): Promise<supertest.Response> {
  const xml = convertToXml(body);
  return supertest.agent(app).post('/change/interpret').set('Content-Type', 'application/xml').send(xml);
}
