import jsLogger from '@map-colonies/js-logger';
import { ChangeManager } from '../../../../src/change/models/changeManager';
import { getSampleData } from '../../../sampleData';

describe('changeManager', function () {
  describe('#mergeChanges', function () {
    it('should merge the changes into the same result', function () {
      const manager = new ChangeManager(jsLogger({enabled: false}));
      const changes = getSampleData();

      const change = manager.mergeChanges(changes, 2);

      expect(change).toMatchSnapshot();
    });

    it('should encode strings using html encoding', function () {
      const manager = new ChangeManager(jsLogger({enabled: false}));
      const changes = getSampleData();
      const tags = changes[0].change.create?.[0].tags;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tags!.html = '< > " \' & © ∆ 🄯';

      const change = manager.mergeChanges(changes, 2);

      expect(change).toMatchSnapshot();
    });
  });
});
