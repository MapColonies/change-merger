import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import nock from 'nock';
import { Application } from 'express';
import { getApp } from '@src/app';
import { trace } from '@opentelemetry/api';
import jsLogger from '@map-colonies/js-logger';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { ConfigType, getConfig } from '../../../src/common/config';
import { MergeChangesRequestBody } from '../../../src/change/controllers/changeController';
import { SERVICES } from '../../../src/common/constants';
import { getSampleData } from '../../sampleData';
import { ChangeWithMetadata, OsmXmlChange } from '../../../src/change/models/change';
import { convertToXml } from '../../../src/change/utils/xml';
import * as changeUtils from '../../../src/change/utils/';
import { InterpretAction, InterpretResult } from '../../../src/change/models/types';
import { ChangeRequestSender } from './helpers/requestSender';

jest.mock('../../../src/change/utils', (): object => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...jest.requireActual('../../../src/change/utils'),
  };
});

describe('change', function () {
  let app: Application;
  let container: DependencyContainer;
  let requestSender: ChangeRequestSender;
  let configInstance: ConfigType;
  let remoteApiUrl: string;
  let remoteReplicationUrl: string;
  let remoteApiInterceptor: nock.Interceptor;
  let remoteReplicationInterceptor: nock.Interceptor;

  beforeAll(async function () {
    configInstance = getConfig();

    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configInstance },
        },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
      useChild: true,
    });

    app = initializedApp;
    container = initializedContainer;

    requestSender = new ChangeRequestSender(app);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);

    remoteApiUrl = config.get('app.remote.api.baseUrl') as unknown as string;
    remoteReplicationUrl = config.get('app.remote.replication.baseUrl') as unknown as string;
    remoteApiInterceptor = nock(remoteApiUrl).get(/.*/);
    remoteReplicationInterceptor = nock(remoteReplicationUrl).get(/.*/);
  });

  afterEach(function () {
    jest.resetAllMocks();
    nock.removeInterceptor(remoteApiInterceptor);
    nock.removeInterceptor(remoteReplicationInterceptor);
  });

  afterAll(async function () {
    const registry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
    await registry.trigger();
    container.reset();
  });

  describe('/POST /change/merge', function () {
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

  describe('/POST /change/interpret', function () {
    describe('Happy Path', function () {
      it('should interpret empty change as empty created and empty deleted', async function () {
        const change: OsmXmlChange = { generator: 'test', version: '0.6' };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual({ created: [], deleted: [] });
      });

      it('should create an empty result for a change with only modify changes', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          modify: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value' } } }],
        };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual({ created: [], deleted: [] });
      });

      it('should create an accurate interpretation result from a change', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
          modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
          delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
        };
        const expected = { created: [{ osmId: 1, externalId: 'value1' }], deleted: [{ osmId: 3, externalId: 'value3' }] };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a change which has tag array', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: [{ k: 'externalId', v: 'value1' }] } }],
          modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
          delete: [
            {
              node: {
                id: 3,
                changeset: 1,
                lat: 1,
                lon: 1,
                version: 1,
                tag: [
                  { k: 'someTag', v: 'someValue' },
                  { k: 'externalId', v: 'value3' },
                ],
              },
            },
          ],
        };
        const expected = { created: [{ osmId: 1, externalId: 'value1' }], deleted: [{ osmId: 3, externalId: 'value3' }] };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a change consisting only create', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        };
        const expected = { created: [{ osmId: 1, externalId: 'value1' }], deleted: [] };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a change consisting only delete', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          delete: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        };
        const expected = { created: [], deleted: [{ osmId: 1, externalId: 'value1' }] };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a rich change', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [
            { node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } },
            { node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1 } },
            { node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'NOTexternalId', v: 'never' } } },
            { way: { id: 4, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'value4' } } },
            { way: { id: 5, changeset: 1, nd: [], version: 1 } },
            { way: { id: 6, changeset: 1, nd: [], version: 1, tag: { k: 'NOTexternalId', v: 'never' } } },
            { relation: { id: 7, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'never' } } },
          ],
          modify: [{ node: { id: 8, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value8' } } }],
          delete: [
            { node: { id: 9, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value9' } } },
            { node: { id: 10, changeset: 1, lat: 1, lon: 1, version: 1 } },
            { node: { id: 11, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'NOTexternalId', v: 'never' } } },
            { way: { id: 12, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'value12' } } },
            { way: { id: 13, changeset: 1, nd: [], version: 1 } },
            { way: { id: 14, changeset: 1, nd: [], version: 1, tag: { k: 'NOTexternalId', v: 'never' } } },
            { relation: { id: 15, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'never' } } },
          ],
        };
        const expected = {
          created: [
            { osmId: 1, externalId: 'value1' },
            { osmId: 4, externalId: 'value4' },
          ],
          deleted: [
            { osmId: 9, externalId: 'value9' },
            { osmId: 12, externalId: 'value12' },
          ],
        };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a change consisting of nodes and ways with the same osmId', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [
            { node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node1' } } },
            { way: { id: 1, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way1' } } },
          ],
          delete: [
            { node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node2' } } },
            { way: { id: 2, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way2' } } },
          ],
        };
        const expected = {
          created: [
            { osmId: 1, externalId: 'node1' },
            { osmId: 1, externalId: 'way1' },
          ],
          deleted: [
            { osmId: 2, externalId: 'node2' },
            { osmId: 2, externalId: 'way2' },
          ],
        };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should create an accurate interpretation result from a change consisting of nodes array and ways array', async function () {
        const change: OsmXmlChange = {
          generator: 'test',
          version: '0.6',
          create: [
            { node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node1' } } },
            { node: [{ id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node2' } }] },
            {
              node: [
                { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node3' } },
                { id: 4, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node4' } },
              ],
            },
            { way: { id: 1, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way1' } } },
            { way: [{ id: 2, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way2' } }] },
            {
              way: [
                { id: 3, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way3' } },
                { id: 4, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way4' } },
              ],
            },
          ],
          delete: [
            { node: { id: 5, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node5' } } },
            { node: [{ id: 6, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node6' } }] },
            {
              node: [
                { id: 7, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node7' } },
                { id: 8, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'node8' } },
              ],
            },
            { way: { id: 5, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way5' } } },
            { way: [{ id: 6, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way6' } }] },
            {
              way: [
                { id: 7, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way7' } },
                { id: 8, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'way8' } },
              ],
            },
          ],
        };

        const expected = {
          created: [
            { type: 'node', osmId: 1, externalId: 'node1' },
            { type: 'node', osmId: 2, externalId: 'node2' },
            { type: 'node', osmId: 3, externalId: 'node3' },
            { type: 'node', osmId: 4, externalId: 'node4' },
            { type: 'way', osmId: 1, externalId: 'way1' },
            { type: 'way', osmId: 2, externalId: 'way2' },
            { type: 'way', osmId: 3, externalId: 'way3' },
            { type: 'way', osmId: 4, externalId: 'way4' },
          ],
          deleted: [
            { type: 'node', osmId: 5, externalId: 'node5' },
            { type: 'node', osmId: 6, externalId: 'node6' },
            { type: 'node', osmId: 7, externalId: 'node7' },
            { type: 'node', osmId: 8, externalId: 'node8' },
            { type: 'way', osmId: 5, externalId: 'way5' },
            { type: 'way', osmId: 6, externalId: 'way6' },
            { type: 'way', osmId: 7, externalId: 'way7' },
            { type: 'way', osmId: 8, externalId: 'way8' },
          ],
        };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
      });

      it('should interpret an invalid osmchange as empty created and empty deleted result', async function () {
        const change = {
          created: 'bad',
        } as unknown as OsmXmlChange;
        const expected = { created: [], deleted: [] };

        const response = await requestSender.postInterpretChange({ osmChange: change });

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual(expected);
      });
    });
  });

  describe('/GET /change/{changesetId}/interpret', function () {
    describe('Happy Path', function () {
      it('should execute a get request to the remote api and interpret the change', async function () {
        const change: { osmChange: OsmXmlChange } = { osmChange: { generator: 'test', version: '0.6' } };
        const xml = convertToXml(change);
        const scope = remoteApiInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'api');

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual({ created: [], deleted: [] });

        scope.done();
      });

      it('should execute a get request to the remote replication and interpret the change', async function () {
        const change: { osmChange: OsmXmlChange } = { osmChange: { generator: 'test', version: '0.6' } };
        const xml = convertToXml(change);
        const unzipAsyncSpy = jest.spyOn(changeUtils, 'unzipAsync').mockResolvedValue(Buffer.from(xml));
        const scope = remoteReplicationInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'replication');

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toEqual({ created: [], deleted: [] });
        expect(unzipAsyncSpy).toHaveBeenCalledTimes(1);

        scope.done();
      });

      it('should execute a get request to the remote api and interpret the change with result consisting created and deleted only', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
            modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
            delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
          },
        };
        const expected = { created: [{ osmId: 1, externalId: 'value1' }], deleted: [{ osmId: 3, externalId: 'value3' }] };
        const xml = convertToXml(change);
        const scope = remoteApiInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'api', ['create', 'delete']);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);

        scope.done();
      });

      it('should execute a get request to the remote api and interpret the change with result consisting of created, modified and deleted', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
            modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
            delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
          },
        };
        const expected = {
          created: [{ osmId: 1, externalId: 'value1' }],
          modified: [{ osmId: 2, externalId: 'value2' }],
          deleted: [{ osmId: 3, externalId: 'value3' }],
        };
        const xml = convertToXml(change);
        const scope = remoteApiInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'api', ['create', 'modify', 'delete']);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);

        scope.done();
      });

      it('should execute a get request to the remote api and interpret the change including tag lookups with result consisting of created, modified and deleted', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
            modify: [
              {
                node: {
                  id: 2,
                  changeset: 1,
                  lat: 1,
                  lon: 1,
                  version: 1,
                  tag: [
                    { k: 'externalId', v: 'value2' },
                    { k: 'historyId', v: 'history2' },
                  ],
                },
              },
            ],
            delete: [
              {
                node: {
                  id: 3,
                  changeset: 1,
                  lat: 1,
                  lon: 1,
                  version: 1,
                  tag: [
                    { k: 'externalId', v: 'value3' },
                    { k: 'someTag', v: 'someValue' },
                    { k: 'historyId', v: 'history3' },
                  ],
                },
              },
            ],
          },
        };
        const expected = {
          created: [{ osmId: 1, externalId: 'value1' }],
          modified: [{ osmId: 2, externalId: 'value2', tags: [{ k: 'historyId', v: 'history2' }] }],
          deleted: [{ osmId: 3, externalId: 'value3', tags: [{ k: 'historyId', v: 'history3' }] }],
        };
        const xml = convertToXml(change);
        const scope = remoteApiInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'api', ['create', 'modify', 'delete'], ['historyId', 'notFoundTag']);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);

        scope.done();
      });

      it('should execute a get request to the remote replication and interpret the change with result consisting only deleted', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
            modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
            delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
          },
        };
        const expected = { deleted: [{ osmId: 3, externalId: 'value3' }] };
        const xml = convertToXml(change);
        const unzipAsyncSpy = jest.spyOn(changeUtils, 'unzipAsync').mockResolvedValue(Buffer.from(xml));
        const scope = remoteReplicationInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'replication', ['delete']);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
        expect(unzipAsyncSpy).toHaveBeenCalledTimes(1);

        scope.done();
      });

      it('should execute a get request to the remote replication and interpret the change with result consisting only modified', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
            modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
            delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
          },
        };
        const expected = { modified: [{ osmId: 2, externalId: 'value2' }] };
        const xml = convertToXml(change);
        const unzipAsyncSpy = jest.spyOn(changeUtils, 'unzipAsync').mockResolvedValue(Buffer.from(xml));
        const scope = remoteReplicationInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'replication', ['modify']);

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
        expect(unzipAsyncSpy).toHaveBeenCalledTimes(1);

        scope.done();
      });

      it('should execute a get request to the remote replication and interpret the change with result even for array of nodes and ways', async function () {
        const change: { osmChange: OsmXmlChange } = {
          osmChange: {
            generator: 'test',
            version: '0.6',
            create: [
              {
                node: [
                  { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } },
                  { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } },
                ],
              },
            ],
            delete: [
              {
                way: [
                  { id: 3, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'value3' } },
                  { id: 4, changeset: 1, nd: [], version: 1, tag: { k: 'externalId', v: 'value4' } },
                ],
              },
            ],
          },
        };
        const expected: Partial<InterpretResult> = {
          created: [
            { type: 'node', osmId: 1, externalId: 'value1' },
            { type: 'node', osmId: 2, externalId: 'value2' },
          ],
          deleted: [
            { type: 'way', osmId: 3, externalId: 'value3' },
            { type: 'way', osmId: 4, externalId: 'value4' },
          ],
        };
        const xml = convertToXml(change);
        const unzipAsyncSpy = jest.spyOn(changeUtils, 'unzipAsync').mockResolvedValue(Buffer.from(xml));
        const scope = remoteReplicationInterceptor.reply(httpStatusCodes.OK, xml);

        const response = await requestSender.getInterpretation('666', 'replication');

        expect(response.status).toBe(httpStatusCodes.OK);
        expect(response.body).toMatchObject(expected);
        expect(unzipAsyncSpy).toHaveBeenCalledTimes(1);

        scope.done();
      });
    });

    it('should execute a get request to the remote replication and interpret including lookup tags the change with result even for array of nodes and ways', async function () {
      const change: { osmChange: OsmXmlChange } = {
        osmChange: {
          generator: 'test',
          version: '0.6',
          create: [
            {
              node: [
                {
                  id: 1,
                  changeset: 1,
                  lat: 1,
                  lon: 1,
                  version: 1,
                  tag: [
                    { k: 'externalId', v: 'value1' },
                    { k: 'historyId', v: 'history1' },
                    { k: 'specialId', v: 'special1' },
                  ],
                },
                { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } },
              ],
            },
          ],
          delete: [
            {
              way: [
                {
                  id: 3,
                  changeset: 1,
                  nd: [],
                  version: 1,
                  tag: [
                    { k: 'externalId', v: 'value3' },
                    { k: 'historyId', v: 'history3' },
                  ],
                },
                {
                  id: 4,
                  changeset: 1,
                  nd: [],
                  version: 1,
                  tag: [
                    { k: 'externalId', v: 'value4' },
                    { k: 'specialId', v: 'special4' },
                    { k: 'otherId', v: 'other4' },
                  ],
                },
              ],
            },
          ],
        },
      };
      const expected: Partial<InterpretResult> = {
        created: [
          {
            type: 'node',
            osmId: 1,
            externalId: 'value1',
            tags: [
              { k: 'historyId', v: 'history1' },
              { k: 'specialId', v: 'special1' },
            ],
          },
          { type: 'node', osmId: 2, externalId: 'value2' },
        ],
        deleted: [
          { type: 'way', osmId: 3, externalId: 'value3', tags: [{ k: 'historyId', v: 'history3' }] },
          { type: 'way', osmId: 4, externalId: 'value4', tags: [{ k: 'specialId', v: 'special4' }] },
        ],
      };
      const xml = convertToXml(change);
      const unzipAsyncSpy = jest.spyOn(changeUtils, 'unzipAsync').mockResolvedValue(Buffer.from(xml));
      const scope = remoteReplicationInterceptor.reply(httpStatusCodes.OK, xml);

      const response = await requestSender.getInterpretation('666', 'replication', ['create', 'delete'], ['historyId', 'specialId']);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toMatchObject(expected);
      expect(unzipAsyncSpy).toHaveBeenCalledTimes(1);

      scope.done();
    });
  });

  describe('Bad Path', function () {
    it('should fail on duplicate action on remote api', async function () {
      const response = await requestSender.getInterpretation('666', 'api', ['create', 'create', 'create']);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toStrictEqual({ message: 'request/query/action must NOT have duplicate items (items ## 1 and 2 are identical)' });
    });

    it('should fail on unknown action on remote replication', async function () {
      const response = await requestSender.getInterpretation('666', 'replication', ['avi'] as unknown as InterpretAction[]);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toStrictEqual({ message: 'request/query/action/0 must be equal to one of the allowed values: create, modify, delete' });
    });

    it('should return not found if remote api changeset was not found', async function () {
      const scope = remoteApiInterceptor.reply(httpStatusCodes.NOT_FOUND);

      const response = await requestSender.getInterpretation('666', 'api');

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);

      scope.done();
    });

    it('should return not found if remote replication changeset was not found', async function () {
      const scope = remoteReplicationInterceptor.reply(httpStatusCodes.NOT_FOUND);

      const response = await requestSender.getInterpretation('666', 'replication');

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);

      scope.done();
    });
  });

  describe('Sad Path', function () {
    it('should return internal error if remote api errored', async function () {
      const scope = remoteApiInterceptor.replyWithError({ message: 'error' });

      const response = await requestSender.getInterpretation('666', 'api');

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);

      scope.done();
    });

    it('should return internal error if remote replication errored', async function () {
      const scope = remoteReplicationInterceptor.replyWithError({ message: 'error' });

      const response = await requestSender.getInterpretation('666', 'replication');

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);

      scope.done();
    });
  });
});
