import { BaseElement } from '@map-colonies/node-osm-elements';
import { RequestChangeObject } from '../src/change/models/types';

export const getSampleData = (): RequestChangeObject[] => [
  {
    action: 'create',
    tempOsmId: -1,
    externalId: 'a',
    change: {
      type: 'osmchange',
      create: ([
        { id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } },
        { id: -3, type: 'node', version: 0, lon: 25, lat: 25 },
        { id: -4, type: 'node', version: 0, lon: 26, lat: 26 },
        {
          id: -1,
          type: 'way',
          version: 0,
          nodes: [
            { id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } },
            { id: -3, type: 'node', version: 0, lon: 25, lat: 25 },
            { id: -4, type: 'node', version: 0, lon: 26, lat: 26 },
          ],
        },
      ] as unknown) as BaseElement[],
    },
  },
  {
    action: 'modify',
    externalId: 'b',
    change: {
      type: 'osmchange',
      create: ([{ id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } }] as unknown) as BaseElement[],
      modify: ([
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
      ] as unknown) as BaseElement[],
    },
  },
  {
    action: 'delete',
    externalId: 'c',
    change: {
      type: 'osmchange',
      delete: ([{ id: -2, type: 'node', version: 0, lon: 24, lat: 24, tags: { cat: 'bark' } }] as unknown) as BaseElement[],
    },
  },
];
