import jsLogger from '@map-colonies/js-logger';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { getSampleData } from '../../../sampleData';
import { getConfig } from '../../../../src/common/config';
import { OsmXmlChange } from '../../../../src/change/models/change';
import { InterpretResult } from '../../../../src/change/models/types';

describe('changeManager', function () {
  let manager: ChangeManager;

  beforeAll(function () {
    const configInstance = getConfig();
    manager = new ChangeManager(jsLogger({ enabled: false }), configInstance);
  });

  describe('#mergeChanges', function () {
    it('should merge the changes into the same result', function () {
      const changes = getSampleData();

      const change = manager.mergeChanges(changes, 2);

      expect(change).toMatchSnapshot();
    });

    it('should encode strings using html encoding', function () {
      const changes = getSampleData();
      const tags = changes[0].change.create?.[0].tags;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tags!.html = '< > " \' & © ∆ 🄯';

      const change = manager.mergeChanges(changes, 2);

      expect(change).toMatchSnapshot();
    });
  });

  describe('#interpretChange', function () {
    it('should create an empty result for empty change', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject({ created: [], deleted: [] });
    });

    it('should create an empty result for a change with only modify changes', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        modify: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value' } } }],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject({ created: [], deleted: [] });
    });

    it('should create an accurate interpretation result from a change', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
        delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
      };
      const expected: InterpretResult = {
        created: [{ type: 'node', osmId: 1, externalId: 'value1' }],
        deleted: [{ type: 'node', osmId: 3, externalId: 'value3' }],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation of created and deleted result from a change', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
        delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
      };
      const expected: InterpretResult = {
        created: [{ type: 'node', osmId: 1, externalId: 'value1' }],
        deleted: [{ type: 'node', osmId: 3, externalId: 'value3' }],
      };

      const interpretation = manager.interpretChange(change, ['create', 'delete']);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation of only the created result from a change', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
        delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
      };
      const expected: Partial<InterpretResult> = {
        created: [{ type: 'node', osmId: 1, externalId: 'value1' }],
      };

      const interpretation = manager.interpretChange(change, ['create']);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation of only the deleted result from a change', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
        modify: [{ node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } }],
        delete: [{ node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } }],
      };
      const expected: Partial<InterpretResult> = {
        deleted: [{ type: 'node', osmId: 3, externalId: 'value3' }],
      };

      const interpretation = manager.interpretChange(change, ['delete']);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a change with a single item as actions', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: { node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } },
        modify: { node: { id: 2, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value2' } } },
        delete: { node: { id: 3, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value3' } } },
      };
      const expected: InterpretResult = {
        created: [{ type: 'node', osmId: 1, externalId: 'value1' }],
        deleted: [{ type: 'node', osmId: 3, externalId: 'value3' }],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a change which has tag array', function () {
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
      const expected: InterpretResult = {
        created: [{ type: 'node', osmId: 1, externalId: 'value1' }],
        deleted: [{ type: 'node', osmId: 3, externalId: 'value3' }],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a change consisting only create', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        create: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
      };
      const expected: InterpretResult = { created: [{ type: 'node', osmId: 1, externalId: 'value1' }], deleted: [] };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a change consisting only delete', function () {
      const change: OsmXmlChange = {
        generator: 'test',
        version: '0.6',
        delete: [{ node: { id: 1, changeset: 1, lat: 1, lon: 1, version: 1, tag: { k: 'externalId', v: 'value1' } } }],
      };
      const expected: InterpretResult = { created: [], deleted: [{ type: 'node', osmId: 1, externalId: 'value1' }] };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a rich change', function () {
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
      const expected: InterpretResult = {
        created: [
          { type: 'node', osmId: 1, externalId: 'value1' },
          { type: 'way', osmId: 4, externalId: 'value4' },
        ],
        deleted: [
          { type: 'node', osmId: 9, externalId: 'value9' },
          { type: 'way', osmId: 12, externalId: 'value12' },
        ],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });

    it('should create an accurate interpretation result from a change consisting of nodes and ways with the same osmId', function () {
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
      const expected: InterpretResult = {
        created: [
          { type: 'node', osmId: 1, externalId: 'node1' },
          { type: 'way', osmId: 1, externalId: 'way1' },
        ],
        deleted: [
          { type: 'node', osmId: 2, externalId: 'node2' },
          { type: 'way', osmId: 2, externalId: 'way2' },
        ],
      };

      const interpretation = manager.interpretChange(change);

      expect(interpretation).toMatchObject(expected);
    });
  });
});
