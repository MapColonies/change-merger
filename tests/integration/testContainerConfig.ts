import { container } from 'tsyringe';
import config from 'config';
import { Services } from '../../src/common/constants';
import { ILogger } from '../../src/common/interfaces';

function registerTestValues(): void {
  const mockLogger: ILogger = { log: jest.fn() };

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: mockLogger });
}

export { registerTestValues };
