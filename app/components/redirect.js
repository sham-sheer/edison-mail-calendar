import React from 'react';
import queryString from 'query-string';
import { Redirect } from 'react-router';
import { connect } from 'react-redux';
import { successOutlookAuth } from '../actions/auth';

import { Client } from '@microsoft/microsoft-graph-client';
import { getAccessToken,filterUser } from '../utils/client/outlook';

import getDb from '../db';

const mapDispatchToProps = dispatch => ({
  successOutlookAuth: (user) => dispatch(successOutlookAuth(user))
});

const mapStateToProps = state => {
  return {
    isAuth: state.auth.currentUser,
  };
};

class OutLookRedirect extends React.Component {
  state = {
    isDone: false,
  }

  async componentDidMount() {
    const response = queryString
      .parse(this.props.location.hash);
    const accessToken = response.access_token;

    var expiresin = (parseInt(response.expires_in) - 300) * 1000;
    var now = new Date();
    var expireDate = new Date(now.getTime() + expiresin);
  
    getAccessToken(accessToken, expireDate.getTime(), (accessToken) => {
      if (accessToken) {
        // Create a Graph client
        var client = Client.init({
          authProvider: (done) => {
            // Just return the token
            done(null, accessToken);
          }
        });
  
        // This first select is to choose from the list of calendars 
        client
          .api('/me')
          .select('*')
          .get(async (err, res) => {
            if (err) {
              console.log(err);
            } else {
              const db = await getDb();
              const filteredSchemaUser = filterUser(res, accessToken, expireDate.getTime());

              const doc = await db.persons.upsert(filteredSchemaUser);
              console.log(doc);

              this.props.successOutlookAuth({ user: filteredSchemaUser });
              await this.setState({
                isDone: true,
              });
            }
          });
      } else {
        var error = { responseText: 'Could not retrieve access token' };
        console.log(error);
      }
    });

  }

  renderRedirect = () => {
    if(this.state.isDone) {
      return (
        <Redirect to="/" />
      );
    }
    else {
      return (
        <div>Loading...</div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderRedirect()}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OutLookRedirect);
