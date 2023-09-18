import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ChangeController } from '../controllers/changeController';

const changeRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ChangeController);

  router.post('/merge', controller.mergeChanges);

  return router;
};

export const CHANGE_ROUTER_SYMBOL = Symbol('changeRouterFactory');

export { changeRouterFactory };
