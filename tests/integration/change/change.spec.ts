import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { MergeChangesRequestBody } from '../../../src/change/controllers/changeController';
import { ChangeWithMetadata } from '../../../src/change/models/types';
import { getSampleData } from '../../sampleData';

import { registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('change', function () {
  beforeEach(function () {
    registerTestValues();
    requestSender.init();
  });
  afterEach(function () {
    container.clearInstances();
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const requestBody: MergeChangesRequestBody = { changesetId: 3, changes: getSampleData() };

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('Bad Path', function () {
    it('should fail if changesetId is not a number', async function () {
      const requestBody = { changesetId: 'aa', changes: getSampleData() } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', 'request.body.changesetId should be number');
    });

    it('should fail if action value is not part of the enum', async function () {
      const changes = getSampleData();
      changes[0].action = 'xd' as 'create';
      const requestBody = { changesetId: 1, changes: changes } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        'request.body.changes[0].action should be equal to one of the allowed values: create, modify, delete'
      );
    });

    it('should fail if externalId is missing', async function () {
      const changes = getSampleData();
      const { externalId, ...newChange } = changes[0];
      changes[0] = newChange as ChangeWithMetadata;
      const requestBody = { changesetId: 1, changes: changes } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', "request.body.changes[0] should have required property 'externalId'");
    });
  });
});
