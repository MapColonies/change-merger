import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { MergeChangesRequestBody } from '../../../src/change/controllers/changeController';
import { ChangeWithMetadata } from '../../../src/change/models/types';
import { getSampleData } from '../../sampleData';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { ChangeRequestSender } from './helpers/requestSender';

describe('change', function () {
  let requestSender: ChangeRequestSender;
  beforeEach(function () {
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    requestSender = new ChangeRequestSender(app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const requestBody: MergeChangesRequestBody = { changesetId: 3, changes: getSampleData() };

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.OK);
      // expect(response).toSatisfyApiSpec();
      expect(response.body).toMatchSnapshot();
    });
  });

  describe('Bad Path', function () {
    it('should fail if changesetId is not a number', async function () {
      const requestBody = { changesetId: 'aa', changes: getSampleData() } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', 'request/body/changesetId must be number');
    });

    it('should fail if action value is not part of the enum', async function () {
      const changes = getSampleData();
      changes[0].action = 'xd' as 'create';
      const requestBody = { changesetId: 1, changes: changes } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty(
        'message',
        'request/body/changes/0/action must be equal to one of the allowed values: create, modify, delete'
      );
    });

    it('should fail if externalId is missing', async function () {
      const changes = getSampleData();
      const { externalId, ...newChange } = changes[0];
      changes[0] = newChange as ChangeWithMetadata;
      const requestBody = { changesetId: 1, changes: changes } as unknown as MergeChangesRequestBody;

      const response = await requestSender.postMergeChanges(requestBody);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toHaveProperty('message', "request/body/changes/0 must have required property 'externalId'");
    });
  });
});
