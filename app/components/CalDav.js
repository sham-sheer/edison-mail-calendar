// @flow
import React, { Component } from 'react';
import { FASTMAIL_USERNAME, FASTMAIL_PASSWORD } from '../utils/Credentials';

const dav = require('dav');

type Props = { beginCreateAccount: () => void };

export default class CalDav extends Component<Props> {
  props: Props;

  render() {
    const { beginCreateAccount } = this.props;

    const xhrObject = new dav.transport.Basic(
      new dav.Credentials({
        username: FASTMAIL_USERNAME,
        password: FASTMAIL_PASSWORD
      })
    );

    const dispatchCreateAccount = () =>
      beginCreateAccount({
        server: 'https://caldav.fastmail.com/dav/',
        xhr: xhrObject,
        loadObjects: true
      });

    return (
      <div>
        <button onClick={dispatchCreateAccount} data-tclass="btn" type="button">
          <i className="fa fa-plus" />
        </button>
      </div>
    );
  }
}
