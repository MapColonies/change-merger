import * as supertest from 'supertest';
import { MergeChangesRequestBody } from '../../../../src/change/controllers/changeController';

export class ChangeRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async postMergeChanges(body: MergeChangesRequestBody): Promise<supertest.Response> {
    return supertest.agent(this.app).post('/change/merge').set('Content-Type', 'application/json').send(body);
  }
}
