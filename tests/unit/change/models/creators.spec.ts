import { OsmNode, OsmWay } from '@map-colonies/node-osm-elements';
import faker from 'faker';
import { createOsmXmlNode, createOsmXmlTag, createOsmXmlWay } from '../../../../src/change/models/generators';

describe('creators', function () {
  describe('#createOsmXmlTag', function () {
    it('should create array of xml tags from a key value object', function () {
      const oldTags = { a: '1', b: '2', c: '3' };

      const newTags = createOsmXmlTag(oldTags);

      expect(newTags).toEqual(
        expect.arrayContaining([
          { k: 'a', v: '1' },
          { k: 'b', v: '2' },
          { k: 'c', v: '3' },
        ])
      );
    });
  });

  describe('#createOsmXmlNode', function () {
    it('should create an xml node based on the given osmNode', () => {
      const node: OsmNode = {
        type: 'node',
        id: faker.random.number({ min: 1 }),
        lat: faker.random.number({ min: -90, max: 90, precision: 2 }),
        lon: faker.random.number({ min: -180, max: 180, precision: 2 }),
        version: faker.random.number({ min: 1, max: 100 }),
        tags: { a: '1' },
      };
      const changesetId = faker.random.number({ min: 1 });

      const newNode = createOsmXmlNode(node, changesetId);

      expect(newNode).toMatchObject({ id: node.id, lon: node.lon, lat: node.lat, version: node.version, changeset: changesetId });
      expect(newNode.tag).toStrictEqual([{ k: 'a', v: '1' }]);
    });
  });
  describe('#createOsmXmlWay', function () {
    it('should create an xmlWay based on the old way, and subtitude the ids where needed', function () {
      const way: OsmWay = {
        type: 'way',
        id: faker.random.number({ min: 1 }),
        version: faker.random.number({ min: 1, max: 100 }),
        tags: { a: '1' },
        nodes: [
          { id: 1, lon: 1, lat: 1, type: 'node' },
          { id: -1, lon: 1, lat: 1, type: 'node' },
          { id: 2, lon: 1, lat: 1, type: 'node' },
        ],
      };
      const changesetId = faker.random.number({ min: 1 });
      const mapping = new Map([[-1, -5]]);

      const newWay = createOsmXmlWay(way, mapping, changesetId);

      expect(newWay).toMatchObject({ id: way.id, version: way.version, changeset: changesetId });
      expect(newWay.tag).toStrictEqual([{ k: 'a', v: '1' }]);
      expect(newWay.nd).toStrictEqual([{ ref: 1 }, { ref: -5 }, { ref: 2 }]);
    });
  });
});
