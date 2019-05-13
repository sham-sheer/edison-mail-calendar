import { combineEpics } from 'redux-observable';
import {
  retrieveEventsEpic,
  storeEventsEpic,
  beginStoreEventsEpic,
  deleteEventEpics
  // updateStoreEventsEpic
} from './db/events';
import {
  beginGetEventsEpics,
  beginGetOutlookEventsEpics,
  beginGetExchangeEventsEpics,
  beginPostEventEpics,
  clearAllEventsEpics,
  pollingEventsEpics,
  pendingActionsEpics
} from './events';
import storeEventPersonEpic from './db/eventPersons';
import {
  storeGoogleAuthEpic,
  storeOutLookAuthEpic,
  storeExchangeAuthEpic
} from './db/auth';

const rootEpic = combineEpics(
  retrieveEventsEpic,
  storeEventsEpic,
  beginStoreEventsEpic,
  beginGetEventsEpics,
  beginGetOutlookEventsEpics,
  beginGetExchangeEventsEpics,
  beginPostEventEpics,
  deleteEventEpics,
  // updateStoreEventsEpic,
  clearAllEventsEpics,
  storeGoogleAuthEpic,
  storeOutLookAuthEpic,
  storeExchangeAuthEpic,
  pollingEventsEpics,
  pendingActionsEpics
);

export default rootEpic;
