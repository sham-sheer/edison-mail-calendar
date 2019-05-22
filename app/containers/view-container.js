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
  clearAllEvents
} from '../actions/events';
import {
  beginRetrieveCaldavEvents,
  resetCaldavAccount,
  beginDeleteCalendarObject,
  beginUpdateCalendarObject
} from '../actions/caldav';
import getFilteredEvents from '../selectors/ui-selector';

const mapStateToProps = state => ({
  events: getFilteredEvents(state),
  initialSync: state.events.initialSync,
  isAuth: state.auth.isAuth,
  providers: state.auth.providers,
  expiredProviders: state.auth.expiredProviders,
  deletedEventId: state.events.deletedEventId
});

const mapDispatchToProps = dispatch => ({
  beginGetGoogleEvents: user => dispatch(beginGetGoogleEvents(user)),
  beginGoogleAuth: () => dispatch(beginGoogleAuth()),

  beginGetOutlookEvents: resp => dispatch(beginGetOutlookEvents(resp)),
  beginOutlookAuth: () => dispatch(beginOutlookAuth()),

  beginGetExchangeEvents: resp => dispatch(beginGetExchangeEvents(resp)),
  beginExchangeAuth: user => dispatch(beginExchangeAuth(user)),

  retrieveStoreEvents: providerType =>
    dispatch(retrieveStoreEvents(providerType)),
  beginDeleteEvent: id => dispatch(beginDeleteEvent(id)),

  clearAllEvents: () => dispatch(clearAllEvents()),

  onStartGetGoogleAuth: user => dispatch(successGoogleAuth(user)),
  onStartGetOutlookAuth: user => dispatch(successOutlookAuth(user)),
  onStartGetExchangeAuth: user => dispatch(successExchangeAuth(user)),

  onExpiredOutlook: user => dispatch(expiredOutlookAuth(user)),
  onExpiredGoogle: user => dispatch(expiredGoogleAuth(user)),

  beginRetrieveCalDavEvents: () => dispatch(beginRetrieveCaldavEvents()),
  resetCaldavAccount: () => dispatch(resetCaldavAccount()),
  beginDeleteCalendarObject: payload =>
    dispatch(beginDeleteCalendarObject(payload)),
  beginUpdateCalendarObject: event => dispatch(beginUpdateCalendarObject(event))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(View));
