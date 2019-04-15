import { createStore, applyMiddleware, compose } from 'redux';
import { createHashHistory } from 'history';
// import thunk from 'redux-thunk';
import { routerMiddleware, routerActions } from 'connected-react-router';
import { createLogger } from 'redux-logger';
// import * as counterActions from '../actions/counter';
// import type { counterStateType } from '../reducers/types';

// new stuff
import { createEpicMiddleware } from 'redux-observable';
import createRootReducer from '../reducers';
import { authBeginMiddleware, authSuccessMiddleware } from '../middleware/auth';
import loggerMiddleware from '../middleware/logger';
import rootEpic from '../epics';
// new stuff

const history = createHashHistory();
const rootReducer = createRootReducer(history);
const epicMiddleware = createEpicMiddleware();

const configureStore = (initialState?: counterStateType) => {
  // Redux Configuration
  const middleware = [];
  const enhancers = [];

  // // Thunk Middleware
  // middleware.push(thunk);

  // Logging Middleware
  const logger = createLogger({
    level: 'info',
    collapsed: true
  });

  // Skip redux logs in console during the tests
  if (process.env.NODE_ENV !== 'test') {
    middleware.push(logger);
  }

  // Router Middleware
  const router = routerMiddleware(history);
  middleware.push(router);

  // // Redux DevTools Configuration
  // const actionCreators = {
  //   ...counterActions,
  //   ...routerActions
  // };
  // If Redux DevTools Extension is installed use it, otherwise use Redux compose
  /* eslint-disable no-underscore-dangle */
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  /* eslint-enable no-underscore-dangle */

  // Apply Middleware & Compose Enhancers
  enhancers.push(
    applyMiddleware(
      ...middleware,
      authBeginMiddleware,
      authSuccessMiddleware,
      epicMiddleware,
      loggerMiddleware
    )
  );
  const enhancer = composeEnhancers(...enhancers);

  // Create Store
  const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(
        authBeginMiddleware,
        authSuccessMiddleware,
        epicMiddleware,
        loggerMiddleware
      )
    )
  );

  if (module.hot) {
    module.hot.accept(
      '../reducers',
      // eslint-disable-next-line global-require
      () => store.replaceReducer(require('../reducers').default)
    );
  }

  epicMiddleware.run(rootEpic);
  return store;
};

export default { configureStore, history };
