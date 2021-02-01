import { ChangeManager } from '../../../../src/change/models/changeManager';
import { getSampleData } from '../../../sampleData';

describe('changeManager', function () {
  describe('#mergeChanges', function () {
    it('should merge the changes into the same result', function () {
      const manager = new ChangeManager({ log: jest.fn() });
      const changes = getSampleData();

      const change = manager.mergeChanges(changes, 2);

      expect(change).toMatchSnapshot();
    });
  });
});
