import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import View from '../components/view';
import {
  successGoogleAuth,
  successOutlookAuth,
  expiredOutlookAuth,
  expiredGoogleAuth,
  beginGoogleAuth,
  beginOutlookAuth,
  beginExchangeAuth,
  successExchangeAuth
} from '../actions/auth';
import { retrieveStoreEvents } from '../actions/db/events';
import {
  beginGetGoogleEvents,
  beginGetOutlookEvents,
  beginGetExchangeEvents,
  beginDeleteEvent,
  clearAllEvents,
  beginPollingEvents,
  endPollingEvents,
  beginPendingActions,
  endPendingActions
} from '../actions/events';
import {
  beginRetrieveCaldavEvents,
  resetCaldavAccount
} from '../actions/caldav';
import getFilteredEvents from '../selectors/ui-selector';

const mapStateToProps = state => ({
  events: getFilteredEvents(state),
  initialSync: state.events.initialSync,
  isAuth: state.auth.isAuth,
  providers: state.auth.providers,
  expiredProviders: state.auth.expiredProviders
});

const mapDispatchToProps = dispatch => ({
  beginGetGoogleEvents: user => dispatch(beginGetGoogleEvents(user)),
  beginGoogleAuth: () => dispatch(beginGoogleAuth()),

  beginGetOutlookEvents: resp => dispatch(beginGetOutlookEvents(resp)),
  beginOutlookAuth: () => dispatch(beginOutlookAuth()),

  beginGetExchangeEvents: resp => dispatch(beginGetExchangeEvents(resp)),
  beginExchangeAuth: user => dispatch(beginExchangeAuth(user)),

  retrieveStoreEvents: (providerType, user) =>
    dispatch(retrieveStoreEvents(providerType, user)),
  beginDeleteEvent: id => dispatch(beginDeleteEvent(id)),

  clearAllEvents: () => dispatch(clearAllEvents()),

  onStartGetGoogleAuth: user => dispatch(successGoogleAuth(user)),
  onStartGetOutlookAuth: user => dispatch(successOutlookAuth(user)),
  onStartGetExchangeAuth: user => dispatch(successExchangeAuth(user)),

  onExpiredOutlook: user => dispatch(expiredOutlookAuth(user)),
  onExpiredGoogle: user => dispatch(expiredGoogleAuth(user)),

  beginPollingEvents: () => dispatch(beginPollingEvents()),
  endPollingEvents: () => dispatch(endPollingEvents()),

  beginPendingActions: providers => dispatch(beginPendingActions(providers)),
  endPendingActions: () => dispatch(endPendingActions()),

  beginRetrieveCalDavEvents: () => dispatch(beginRetrieveCaldavEvents()),
  resetCaldavAccount: () => dispatch(resetCaldavAccount())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(View));
