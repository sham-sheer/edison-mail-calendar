// @flow
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import type { Store } from '../reducers/types';
import Routes from '../Routes';
import { FASTMAIL_USERNAME, FASTMAIL_PASSWORD } from '../utils/Credentials';

type Props = {
  store: Store,
  history: {}
};

const dav = require('dav');

export default class Root extends Component<Props> {
  componentDidMount() {
    const xhrObject = new dav.transport.Basic(
      new dav.Credentials({
        username: FASTMAIL_USERNAME,
        password: FASTMAIL_PASSWORD
      })
    );

    return dav
      .createAccount({
        server: 'https://caldav.fastmail.com/dav/',
        xhr: xhrObject,
        loadObjects: true
      })
      .then(console.log);
  }

  render() {
    const { store, history } = this.props;
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Routes />
        </ConnectedRouter>
      </Provider>
    );
  }
}
