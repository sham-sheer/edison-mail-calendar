import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
// import Routes from './routes';
import Root from './containers/Root';
import { configureStore, history } from './store/configureStore';
// import './app.global.css';

import './index.css';
import './bootstrap.css';
import * as Credentials from './utils/Credentials';
import * as CalDavActionCreators from './actions/caldav';
import ServerUrls from './utils/serverUrls';

const dav = require('dav');

const xhrObject = new dav.transport.Basic(
  new dav.Credentials({
    username: Credentials.ICLOUD_USERNAME,
    password: Credentials.ICLOUD_PASSWORD
  })
);
const store = configureStore();

store.dispatch(
  CalDavActionCreators.beginCreateAccount({
    server: ServerUrls.ICLOUD,
    xhr: xhrObject,
    loadObjects: true
  })
);

render(
  <AppContainer>
    <Root store={store} history={history} />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./containers/root', () => {
    // eslint-disable-next-line global-require
    const NextRoot = require('./containers/Root').default;
    render(
      <AppContainer>
        <NextRoot store={store} history={history} />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
