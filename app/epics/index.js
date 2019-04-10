import { combineEpics } from 'redux-observable';
import {
  retrieveEventsEpic,
  storeEventsEpic,
  beginStoreEventsEpic,
  deleteEventEpics
} from './db/events';
import {
  beginGetEventsEpics,
  beginGetOutlookEventsEpics,
  beginGetExchangeEventsEpics,
  beginPostEventEpics,
  clearAllEventsEpics,
} from './events';
import {
  storeEventPersonEpic
} from './db/eventPersons';
import {
  storeGoogleAuthEpic,
  storeOutLookAuthEpic,
  storeExchangeAuthEpic
} from './db/auth';

export const rootEpic = combineEpics(
  retrieveEventsEpic,
  storeEventsEpic,
  beginStoreEventsEpic,
  beginGetEventsEpics,
  beginGetOutlookEventsEpics,
  beginGetExchangeEventsEpics,
  beginPostEventEpics,
  deleteEventEpics,
  clearAllEventsEpics,
  storeGoogleAuthEpic,
  storeOutLookAuthEpic,
  storeExchangeAuthEpic,
);
