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
  endPendingActions,
  beginDeleteRecurrenceSeries,
  beginDeleteFutureRecurrenceSeries,
  editEventsBeginCaldav
} from '../actions/events';
import {
  beginRetrieveCaldavEvents,
  resetCaldavAccount,
  beginDeleteCalendarObject,
  beginUpdateCalendarObject,
  beginCreateCalendarObject
} from '../actions/caldav';
import getFilteredEvents from '../selectors/ui-selector';

const mapStateToProps = (state) => ({
  events: getFilteredEvents(state),
  initialSync: state.events.initialSync,
  isAuth: state.auth.isAuth,
  providers: state.auth.providers,
  expiredProviders: state.auth.expiredProviders,
  deletedEventId: state.events.deletedEventId
});

const mapDispatchToProps = (dispatch) => ({
  beginGetGoogleEvents: (user) => dispatch(beginGetGoogleEvents(user)),
  beginGoogleAuth: () => dispatch(beginGoogleAuth()),

  beginGetOutlookEvents: (resp) => dispatch(beginGetOutlookEvents(resp)),
  beginOutlookAuth: () => dispatch(beginOutlookAuth()),

  beginGetExchangeEvents: (resp) => dispatch(beginGetExchangeEvents(resp)),
  beginExchangeAuth: (user) => dispatch(beginExchangeAuth(user)),

  retrieveStoreEvents: (providerType, user) => dispatch(retrieveStoreEvents(providerType, user)),

  beginDeleteEvent: (id) => dispatch(beginDeleteEvent(id)),
  beginDeleteRecurrenceSeries: (id) => dispatch(beginDeleteRecurrenceSeries(id)),
  beginDeleteFutureRecurrenceSeries: (id) => dispatch(beginDeleteFutureRecurrenceSeries(id)),

  clearAllEvents: () => dispatch(clearAllEvents()),

  onStartGetGoogleAuth: (user) => dispatch(successGoogleAuth(user)),
  onStartGetOutlookAuth: (user) => dispatch(successOutlookAuth(user)),
  onStartGetExchangeAuth: (user) => dispatch(successExchangeAuth(user)),

  onExpiredOutlook: (user) => dispatch(expiredOutlookAuth(user)),
  onExpiredGoogle: (user) => dispatch(expiredGoogleAuth(user)),

  beginPollingEvents: () => dispatch(beginPollingEvents()),
  endPollingEvents: () => dispatch(endPollingEvents()),

  beginPendingActions: (providers) => dispatch(beginPendingActions(providers)),
  endPendingActions: () => dispatch(endPendingActions()),

  // beginPollingEvents: () => dispatch(beginPollingEvents()),
  // endPollingEvents: () => dispatch(endPollingEvents()),
  //
  // beginPendingActions: providers => dispatch(beginPendingActions(providers)),
  // endPendingActions: () => dispatch(endPendingActions()),

  beginRetrieveCalDavEvents: () => dispatch(beginRetrieveCaldavEvents()),
  resetCaldavAccount: () => dispatch(resetCaldavAccount()),
  beginDeleteCalendarObject: (eventId) => dispatch(beginDeleteCalendarObject(eventId)),
  beginUpdateCalendarObject: (event) => dispatch(beginUpdateCalendarObject(event)),
  editEventsBeginCaldav: (currentEvent) => dispatch(editEventsBeginCaldav(currentEvent)),
  beginCreateCalendarObject: (payload) => dispatch(beginCreateCalendarObject(payload))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(View));
