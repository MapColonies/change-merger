import { BaseElement } from '@map-colonies/node-osm-elements';
import { mergeChanges } from '../../../../src/change/models/merger';
import { ChangeWithMetadata } from '../../../../src/change/models/types';

describe('merger', function () {
  describe('#mergeChanges', function () {
    it('merge two changes into one', function () {
      const incomingChanges: ChangeWithMetadata[] = [
        {
          action: 'create',
          tempOsmId: -5,
          externalId: 'aaa',
          change: {
            type: 'osmchange',
            create: [{ id: -5, type: 'node', lon: 13, lat: 14, tags: { cat: 'meow' }, version: 1 } as BaseElement],
          },
        },
        {
          action: 'create',
          tempOsmId: -3,
          externalId: 'bbb',
          change: {
            type: 'osmchange',
            create: [{ id: -3, type: 'node', lon: 15, lat: 16, tags: { cat: 'meow' }, version: 1 } as BaseElement],
          },
        },
      ];

      const [mergedChange, idsToCreate, idsToDelete] = mergeChanges(incomingChanges, 1);

      expect(mergedChange.create.node).toHaveLength(2);
      const [nodeOne, nodeTwo] = mergedChange.create.node;
      expect(nodeOne).toMatchObject({ lat: 14, lon: 13 });
      expect(nodeTwo).toMatchObject({ lat: 16, lon: 15 });
      expect(idsToCreate).toEqual(
        expect.arrayContaining([
          { externalId: 'aaa', tempOsmId: -1 },
          { externalId: 'bbb', tempOsmId: -2 },
        ])
      );
      expect(idsToDelete).toHaveLength(0);
    });

    it('should keep the order, but change the temp id of node in way', function () {
      const incomingChanges: ChangeWithMetadata[] = [
        {
          action: 'modify',
          tempOsmId: 0,
          externalId: 'b',
          change: {
            type: 'osmchange',
            create: [{ id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } }] as unknown as BaseElement[],
            modify: [
              {
                id: 1,
                type: 'way',
                version: 0,
                nodes: [
                  { id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } },
                  { id: 3, type: 'node', version: 0, lon: 25, lat: 25 },
                  { id: 4, type: 'node', version: 0, lon: 26, lat: 26 },
                ],
              },
            ] as unknown as BaseElement[],
          },
        },
      ];

      const [mergedChange, idsToCreate, idsToDelete] = mergeChanges(incomingChanges, 1);

      expect(idsToCreate).toHaveLength(0);
      expect(idsToDelete).toHaveLength(0);
      expect(mergedChange.create.node[0].id).toEqual(mergedChange.modify.way[0].nd[0].ref);
    });

    it('should add the externalId to delete to the delete list', function () {
      const incomingChanges: ChangeWithMetadata[] = [
        {
          action: 'delete',
          tempOsmId: 0,
          externalId: 'c',
          change: {
            type: 'osmchange',
            delete: [{ id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } }] as unknown as BaseElement[],
          },
        },
      ];

      const [, , idsToDelete] = mergeChanges(incomingChanges, 1);

      expect(idsToDelete[0]).toBe('c');
    });
  });
});
