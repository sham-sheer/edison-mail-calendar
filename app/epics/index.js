// import { combineEpics } from 'redux-observable';
// import {
//   retrieveEventsEpic,
//   storeEventsEpic,
//   beginStoreEventsEpic,
//   deleteEventEpics
//   // updateStoreEventsEpic
// } from './db/events';
// import {
//   beginGetEventsEpics,
//   beginGetOutlookEventsEpics,
//   beginGetExchangeEventsEpics,
//   beginPostEventEpics,
//   clearAllEventsEpics
// } from './events';
// import storeEventPersonEpic from './db/eventPersons';
// import {
//   storeGoogleAuthEpic,
//   storeOutLookAuthEpic,
//   storeExchangeAuthEpic
// } from './db/auth';
//
// const rootEpic = combineEpics(
//   retrieveEventsEpic,
//   storeEventsEpic,
//   beginStoreEventsEpic,
//   beginGetEventsEpics,
//   beginGetOutlookEventsEpics,
//   beginGetExchangeEventsEpics,
//   beginPostEventEpics,
//   deleteEventEpics,
//   // updateStoreEventsEpic,
//   clearAllEventsEpics,
//   storeGoogleAuthEpic,
//   storeOutLookAuthEpic,
//   storeExchangeAuthEpic
// );
//
// export default rootEpic;

import 'rxjs/Rx';
import { combineEpics } from 'redux-observable';
import * as caldavEpics from './caldav';
import * as eventsEpics from './events';
import dbEpics from './db';

export default combineEpics(
  ...Object.values(caldavEpics),
  ...Object.values(eventsEpics),
  ...Object.values(dbEpics)
);
