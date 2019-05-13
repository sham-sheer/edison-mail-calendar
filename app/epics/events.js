import {
  map,
  mergeMap,
  catchError,
  takeUntil,
  distinctUntilChanged,
  combineLatest,
  startWith,
  switchMap,
  delay,
  concatMap
} from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from, iif, of, timer, interval } from 'rxjs';
import { normalize, schema } from 'normalizr';
import { Client } from '@microsoft/microsoft-graph-client';
import * as RxDB from 'rxdb';
import {
  ExchangeService,
  Uri,
  ExchangeCredentials,
  Appointment,
  MessageBody,
  DateTime,
  WellKnownFolderName,
  SendInvitationsMode,
  Item,
  PropertySet,
  ItemSchema
} from 'ews-javascript-api';
import moment from 'moment';
import _ from 'lodash';
import { fromPromise } from 'rxjs/internal-compatibility';
import {
  duplicateAction,
  syncStoredEvents,
  UPDATE_STORED_EVENTS,
  retrieveStoreEvents
} from '../actions/db/events';
import {
  loadClient,
  loadFullCalendar,
  loadSyncCalendar,
  loadNextPage,
  postGoogleEvent,
  deleteGoogleEvent,
  editGoogleEvent
} from '../utils/client/google';
import * as Providers from '../utils/constants';
import {
  getUserEvents,
  getAccessToken,
  filterEventToOutlook
} from '../utils/client/outlook';
import {
  getAllEvents,
  asyncExchangeRequest,
  findSingleEventById,
  updateEvent,
  asyncDeleteSingleEventById,
  exchangeDeleteEvent
} from '../utils/client/exchange';
import {
  GET_EVENTS_BEGIN,
  EDIT_EVENT_BEGIN,
  POST_EVENT_BEGIN,
  CLEAR_ALL_EVENTS,
  GET_OUTLOOK_EVENTS_BEGIN,
  GET_EXCHANGE_EVENTS_BEGIN,
  BEGIN_POLLING_EVENTS,
  END_POLLING_EVENTS,
  BEGIN_PENDING_ACTIONS,
  END_PENDING_ACTIONS,
  CLEAR_ALL_EVENTS_SUCCESS,
  apiFailure,
  getEventsSuccess,
  postEventSuccess,
  editEventSuccess,
  getEventsFailure,
  clearAllEventsSuccess,
  endPollingEvents
} from '../actions/events';
import getDb from '../db';
import * as Credentials from '../utils/Credentials';
import * as CalDavActionCreators from '../actions/caldav';
import ServerUrls from '../utils/serverUrls';

const dav = require('dav');

export const beginGetEventsEpics = action$ =>
  action$.pipe(
    ofType(GET_EVENTS_BEGIN),
    mergeMap(action =>
      iif(
        () => action.payload !== undefined,
        from(loadClient()).pipe(
          mergeMap(() =>
            from(setCalendarRequest()).pipe(
              mergeMap(resp =>
                from(eventsPromise(resp)).pipe(
                  // made some changes here for resp, unsure if it breaks.
                  map(resp2 => getEventsSuccess(resp2, Providers.GOOGLE))
                )
              )
            )
          )
        ),
        of(getEventsFailure('Google user undefined!!'))
      )
    )
  );

export const beginEditEventEpics = action$ =>
  action$.pipe(
    ofType(EDIT_EVENT_BEGIN),
    mergeMap(action =>
      from(editEvent(action.payload)).pipe(
        map(
          resp => editEventSuccess(resp),
          catchError(error => apiFailure(error))
        )
      )
    )
  );

const editEvent = async payload => {
  const calendarObject = payload.data;
  const { id } = payload;
  await loadClient();
  return editGoogleEvent(id, calendarObject);
};

export const beginPostEventEpics = action$ =>
  action$.pipe(
    ofType(POST_EVENT_BEGIN),
    mergeMap(action => {
      if (action.payload.providerType === Providers.GOOGLE) {
        return from(postEvent(action.payload)).pipe(
          map(
            resp => postEventSuccess([resp.result], action.payload.providerType) // Think if you need to pass in owner here
          ),
          catchError(error => apiFailure(error))
        );
      }
      if (action.payload.providerType === Providers.OUTLOOK) {
        return from(postEventsOutlook(action.payload)).pipe(
          map(resp => postEventSuccess([resp], action.payload.providerType)), // Think if you need to pass in owner here
          catchError(error => apiFailure(error))
        );
      }
      if (action.payload.providerType === Providers.EXCHANGE) {
        return from(postEventsExchange(action.payload)).pipe(
          map(resp =>
            postEventSuccess(
              [resp],
              action.payload.providerType,
              action.payload.auth.email
            )
          ),
          catchError(error => apiFailure(error))
        );
      }
    })
  );

const postEvent = async resource => {
  const calendarObject = {
    calendarId: 'primary',
    resource: resource.data
  };
  await loadClient();
  return postGoogleEvent(calendarObject);
};

const postEventsOutlook = payload =>
  new Promise((resolve, reject) => {
    getAccessToken(
      payload.auth.accessToken,
      payload.auth.accessTokenExpiry,
      accessToken => {
        if (accessToken) {
          // Create a Graph client
          const client = Client.init({
            authProvider: done => {
              // Just return the token
              done(null, accessToken);
            }
          });

          // This first select is to choose from the list of calendars
          resolve(
            client
              .api(
                '/me/calendars/AAMkAGZlZDEyNmMxLTMyNDgtNDMzZi05ZmZhLTU5ODk3ZjA5ZjQyOABGAAAAAAA-XPNVbhVJSbREEYK0xJ3FBwCK0Ut7mQOxT5W1Wd82ZSuqAAAAAAEGAACK0Ut7mQOxT5W1Wd82ZSuqAAGfLM-yAAA=/events'
              )
              .post(filterEventToOutlook(payload.data))
          );
        } else {
          const error = { responseText: 'Could not retrieve access token' };
          console.log(error);
          reject(error);
        }
      }
    );
  });

const postEventsExchange = payload =>
  new Promise((resolve, reject) => {
    const exch = new ExchangeService();
    exch.Url = new Uri('https://outlook.office365.com/Ews/Exchange.asmx');
    exch.Credentials = new ExchangeCredentials(
      payload.auth.email,
      payload.auth.password
    );

    const newEvent = new Appointment(exch);

    newEvent.Subject = payload.data.summary;
    newEvent.Body = new MessageBody(payload.data.description);
    newEvent.Start = new DateTime(
      moment.tz(payload.data.start.dateTime, payload.data.start.timezone)
    );
    newEvent.End = new DateTime(
      moment.tz(payload.data.end.dateTime, payload.data.end.timezone)
    );
    console.log('New Exchange Event!!', newEvent);
    newEvent
      .Save(
        WellKnownFolderName.Calendar,
        SendInvitationsMode.SendToAllAndSaveCopy
      )
      .then(
        async () => {
          const item = await Item.Bind(
            exch,
            newEvent.Id
            // new PropertySet(ItemSchema.Subject)
          );
          console.log('New Exchange Event Re-Get: ', item);

          const db = await getDb();
          await db.events.upsert(
            Providers.filterIntoSchema(
              item,
              Providers.EXCHANGE,
              payload.auth.email
            )
          );
          resolve(item);
        },
        error => reject(error)
      )
      .catch(error => console.log(error));
  });

const deleteEvent = async id => {
  await loadClient();
  return deleteGoogleEvent(id);
};

const setCalendarRequest = () => {
  let request;
  const syncToken = localStorage.getItem('sync');
  if (syncToken == null) {
    console.log('Performing full sync');
    request = loadFullCalendar();
  } else {
    console.log('Performing incremental sync');
    request = loadSyncCalendar(syncToken);
  }
  return request;
};

const normalizeEvents = response => {
  const singleEvent = new schema.Entity('events');
  const results = normalize({ events: response }, { events: [singleEvent] });
  return results;
};

const eventsPromise = async resp => {
  const items = [];
  return new Promise((resolve, reject) => {
    fetchEvents(resp, items, resolve, reject);
  });
};

const fetchEvents = (resp, items, resolve, reject) => {
  const newItems = items.concat(resp.result.items);
  if (resp.result.nextPageToken !== undefined) {
    loadNextPage(resp.result.nextPageToken)
      .then(nextResp => fetchEvents(nextResp, newItems, resolve, reject))
      .catch(e => {
        if (e.code === 410) {
          console.log(
            'Invalid sync token, clearing event store and re-syncing.'
          );
          localStorage.deleteItem('sync');
          loadFullCalendar().then(newResp =>
            fetchEvents(newResp, items, resolve, reject)
          );
        } else {
          console.log(e);
          reject('Something went wrong, Please refresh and try again');
        }
      });
  } else {
    localStorage.setItem('sync', resp.result.nextSyncToken);
    resolve(newItems);
  }
};

// ------------------------------------ OUTLOOK ------------------------------------ //
export const beginGetOutlookEventsEpics = action$ =>
  action$.pipe(
    ofType(GET_OUTLOOK_EVENTS_BEGIN),
    mergeMap(action =>
      from(
        new Promise((resolve, reject) => {
          if (action.payload === undefined) {
            reject(getEventsFailure('Outlook user undefined!!'));
          }

          console.log('Outlook Performing full sync', action);
          getUserEvents(
            action.payload.accessToken,
            action.payload.accessTokenExpiry,
            (events, error) => {
              if (error) {
                console.error(error);
                return;
              }

              resolve(events);
            }
          );
        })
      ).pipe(
        map(resp =>
          getEventsSuccess(resp, Providers.OUTLOOK, action.payload.email)
        ),
        catchError(error => of(error))
      )
    )
  );
// ------------------------------------ OUTLOOK ------------------------------------ //

// ------------------------------------ EXCHANGE ------------------------------------ //
export const beginGetExchangeEventsEpics = action$ =>
  action$.pipe(
    ofType(GET_EXCHANGE_EVENTS_BEGIN),
    mergeMap(action =>
      from(
        new Promise(async (resolve, reject) => {
          if (action.payload === undefined) {
            reject(getEventsFailure('Exchange user undefined!!'));
          }

          resolve(
            getAllEvents(
              action.payload.email,
              action.payload.password,
              'https://outlook.office365.com/Ews/Exchange.asmx'
            )
          );
        })
      ).pipe(
        map(resp =>
          getEventsSuccess(resp, Providers.EXCHANGE, action.payload.email)
        ),
        catchError(error => of(error))
      )
    )
  );
// ------------------------------------ EXCHANGE ------------------------------------ //

// ------------------------------------ GENERAL ------------------------------------ //
export const clearAllEventsEpics = action$ =>
  action$.pipe(
    ofType(CLEAR_ALL_EVENTS),
    map(() => {
      localStorage.clear();
      RxDB.removeDatabase('eventsdb', 'websql');
      return clearAllEventsSuccess();
    })
  );

// export const testingEpics = action$ =>
//   action$.pipe(
//     ofType(CLEAR_ALL_EVENTS),
//     mergeMap(data =>
//       from(
//         new Promise((resolve, reject) => {
//           resolve('hello world');
//         })
//       ).pipe(
//         mergeMap(() =>
//           of(
//             { type: 'ADD_CATEGORY_SUCCESS' },
//             { type: 'GET_CATEGORIES_REQUEST' }
//           )
//         )
//       )
//     )
//   );

export const createCaldavAccountEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.RESET_CALDAV_ACCOUNT),
    map(() => {
      const xhrObject = new dav.transport.Basic(
        new dav.Credentials({
          username: Credentials.ICLOUD_USERNAME,
          password: Credentials.ICLOUD_PASSWORD
        })
      );
      return CalDavActionCreators.beginCreateAccount({
        server: ServerUrls.ICLOUD,
        xhr: xhrObject,
        loadObjects: true
      });
    })
  );
// ------------------------------------ GENERAL ------------------------------------ //

// ------------------------------------ POLLING ------------------------------------ //
export const pollingEventsEpics = action$ => {
  const stopPolling$ = action$.pipe(ofType(END_POLLING_EVENTS));
  return action$.pipe(
    ofType(BEGIN_POLLING_EVENTS, UPDATE_STORED_EVENTS),
    // ofType(BEGIN_POLLING_EVENTS),
    switchMap(action =>
      interval(10 * 1000).pipe(
        takeUntil(stopPolling$),
        switchMap(() => from(syncEvents(action))),
        // map(events =>
        //   events.map(singleEvent => ({
        //     id: singleEvent.id,
        //     end: singleEvent.end,
        //     start: singleEvent.start,
        //     summary: singleEvent.summary,
        //     organizer: singleEvent.organizer,
        //     recurrence: singleEvent.recurrence,
        //     iCalUID: singleEvent.iCalUID,
        //     attendees: singleEvent.attendees,
        //     originalId: singleEvent.originalId,
        //     owner: singleEvent.owner,
        //     hide: singleEvent.hide
        //   }))
        // ),
        map(results => syncStoredEvents(results))
      )
    )
  );
};

const syncEvents = async action => {
  const { user } = action.payload;

  switch (user.providerType) {
    case Providers.GOOGLE:
      break;
    case Providers.OUTLOOK:
      break;
    case Providers.EXCHANGE:
      try {
        const appts = await asyncExchangeRequest(
          user.email,
          user.password,
          'https://outlook.office365.com/Ews/Exchange.asmx'
        );
        const db = await getDb();
        const dbEvents = await db.events.find().exec();
        const updatedEvents = [];
        const listOfPriomises = [];

        // const idSet = new Set();

        // console.log(appts);

        for (const appt of appts) {
          if (appt.IsRecurring) {
            continue;
          }

          // idSet.add(appt.Id.UniqueId);

          const dbObj = dbEvents.filter(
            dbEvent => dbEvent.originalId === appt.Id.UniqueId
          );

          const filteredEvent = Providers.filterIntoSchema(
            appt,
            Providers.EXCHANGE,
            user.email
          );

          if (dbObj.length === 0) {
            // New object from server, add and move on to next one.
            updatedEvents.push({ event: filteredEvent, type: 'create' });
            listOfPriomises.push(db.events.upsert(filteredEvent));
          } else {
            // Sync old objects and compare in case.
            const dbEvent = dbObj[0];
            const lastUpdatedTime = moment(dbEvent.updated);

            if (
              appt.Id.UniqueId === dbEvent.originalId &&
              appt.LastModifiedTime.getMomentDate() > lastUpdatedTime
            ) {
              updatedEvents.push({ event: filteredEvent, type: 'update' });
              listOfPriomises.push(db.events.upsert(filteredEvent));
            }
          }
        }

        // Check for deleted events, as if it not in the set, it means that it could be deleted.
        // In database, but not on server, as we are taking server, we just assume delete.
        for (const dbEvent of dbEvents) {
          const result = appts.find(
            appt => appt.Id.UniqueId === dbEvent.originalId
          );
          if (result !== undefined) {
            continue;
          }
          // console.log(
          //   'Found a event deleted remotely, but not locally',
          //   dbEvent
          // );

          // Means not found, delete it.
          updatedEvents.push({
            event: Providers.filterEventIntoSchema(dbEvent),
            type: 'delete'
          });

          const query = db.events
            .find()
            .where('originalId')
            .eq(dbEvent.originalId);
          listOfPriomises.push(query.remove());
          // if (idSet.has(dbEvent.originalId)) {
          //   continue;
          // }

          // Deal with the specific event that could be deleted.
          // If the code comes here, it means we found an event that is
          // 1. Not in the appointment array from the server
          // 2. Not in the set
          // This means, It is not a new event and is not on the server, aka, deleted.
          // updatedEvents.push(filteredEvent);
        }
        // console.log('here?!');
        await Promise.all(listOfPriomises);
        return updatedEvents;
      } catch (error) {
        // console.log(error);
        // Return empty array, let next loop handle syncing.
        return [];
      }
    default:
      break;
  }
};
// ------------------------------------ POLLING ------------------------------------ //

// ------------------------------------ PENDING ACTIONS ------------------------------------ //
export const pendingActionsEpics = action$ => {
  // Stop upon a end pending action trigger, for debugging/stopping if needed
  const stopPolling$ = action$.pipe(ofType(END_PENDING_ACTIONS));
  return action$.pipe(
    // On begin pending actions
    ofType(BEGIN_PENDING_ACTIONS),
    switchMap(action =>
      // At a 5 second interval
      interval(5 * 1000).pipe(
        // Stop when epics see a end pending action
        takeUntil(stopPolling$),
        switchMap(() =>
          // Get the db
          from(getDb()).pipe(
            mergeMap(db =>
              // Get all the pending actions
              from(db.pendingactions.find().exec()).pipe(
                // what happens if action is still running but no internet?
                // delay(9.9 * 1000),
                // actions is an array from the db
                // switchmap at top is reason for it, handle for future. lol
                mergeMap(actions =>
                  from(handlePendingActions(action.payload, actions, db)).pipe(
                    mergeMap(result => {
                      console.log(result);
                      return of(...result);
                    })
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

const reflect = p =>
  p.then(v => ({ v, status: 'fulfilled' }), e => ({ e, status: 'rejected' }));

const handlePendingActions = async (users, actions, db) => {
  const docs = await db.events.find().exec();
  // console.log(users, actions);
  // console.log(docs);

  const promisesArr = actions.map(async action => {
    const rxDbObj = docs.filter(obj => obj.originalId === action.eventId)[0];
    const user = users[rxDbObj.providerType].filter(
      indivAcc => indivAcc.owner === rxDbObj.email
    )[0];

    let serverObj;

    try {
      switch (rxDbObj.providerType) {
        case Providers.GOOGLE:
          break;
        case Providers.OUTLOOK:
          break;
        case Providers.EXCHANGE:
          serverObj = await findSingleEventById(
            user.email,
            user.password,
            'https://outlook.office365.com/Ews/Exchange.asmx',
            rxDbObj.originalId
          );
          break;
        default:
          return apiFailure('Unhandled provider for Pending actions');
      }

      const resultingAction = await handleMergeEvents(
        rxDbObj,
        serverObj,
        db,
        action.type,
        user
      );
      return { result: resultingAction, user };
    } catch (error) {
      throw error;
    }
  });

  // The logic here, is to wait for all promises to complete, NO MATTER SUCCESS OR FAILURE
  // Reason being is we want it tt requeue the failed ones, but still not block the UI.
  // We use reflect for this, not sure why yet, link: https://stackoverflow.com/questions/31424561/wait-until-all-es6-promises-complete-even-rejected-promises
  // Based on each result, if ANY of them is a success, we start retrieving stored events
  // and assume that our queue is still valid, and let it re-run on its own.
  // However, I need to retrieve stored events for the providers that are fulfilled, and not those who are not.
  const result = await Promise.all(promisesArr.map(reflect));
  const appendedUsers = [];
  const noDuplicateUsers = result.reduce((a, b) => {
    if (
      b.status === 'fulfilled' && // ensure that it is a success
      !a.some(singleUser => _.isEqual(singleUser.v.user, b.v.user)) && // ensure that the same user is not inside
      !(
        appendedUsers.filter(appendedUser => _.isEqual(appendedUser, b.v.user))
          .length > 1
      ) // ensure that the return array does not contain that user
    ) {
      a.push(b);
      appendedUsers.push(b.v.user);
    }
    return a;
  }, []);

  const resultingAction = noDuplicateUsers.map(indivAcc =>
    retrieveStoreEvents(indivAcc.v.user.providerType, indivAcc.v.user)
  );

  // // Unsure if needed due to if all fail to send
  // if (resultingAction.length === 0) {
  //   return [];
  // }
  return resultingAction;
};

const handleMergeEvents = async (localObj, serverObj, db, type, user) => {
  // console.log(localObj, serverObj, localObj.local);
  const filteredServerObj = Providers.filterIntoSchema(
    serverObj,
    localObj.providerType,
    localObj.owner
  );
  const localUpdatedTime = moment(localObj.updated);
  const serverUpdatedTime = moment(filteredServerObj.updated);

  const dateIsAfter = localUpdatedTime.isAfter(serverUpdatedTime);
  const dateIsBefore = localUpdatedTime.isBefore(serverUpdatedTime);

  let result;

  if (localObj.local) {
    const dateIsSame = localUpdatedTime.isSame(serverUpdatedTime);
    // console.log(`Date is Same: ${dateIsSame}`);

    if (dateIsSame) {
      // Take local
      switch (localObj.providerType) {
        case Providers.GOOGLE:
          break;
        case Providers.OUTLOOK:
          break;
        case Providers.EXCHANGE:
          console.log('Running exchange: ', type);
          switch (type) {
            case 'update':
              // console.log('Update type, Call update on exchange');
              // TO-DO, add more update fields
              serverObj.Subject = localObj.summary;
              serverObj.Location = localObj.location;

              result = await updateEvent(serverObj, user, () => {
                console.log('conflict solved exchange');
              });

              /*
                Goal is to check for every result, if fail or success

                If success, I can return the result actually
                If fail, I want to retry. And here, I can retry on the back as it is part of my stream.

                Due to the timer loop, I can just ignore and retry by pushing it back into the db. Cool

                One point to note for future is how to handle increment of timer freq for each event upon
                a failure of uploading. Need to think how to handle this in the future!!

                How about upon a success, I then remove it. If fail, I ignore removing it? Smooth.
                Don't need to keep upserting
              */
              if (result.type === 'EDIT_EVENT_SUCCESS') {
                const query = db.pendingactions
                  .find()
                  .where('eventId')
                  .eq(filteredServerObj.originalId);
                await query.remove();
              }
              return result;
            case 'delete':
              // console.log('Delete type, Deleting appt on exchange now');
              // console.log(localObj, serverObj, db, type);

              result = await exchangeDeleteEvent(serverObj, user, () => {
                // console.log('deleted exchange event');
              });

              if (result.type === 'DELETE_EVENT_SUCCESS') {
                const query = db.pendingactions
                  .find()
                  .where('eventId')
                  .eq(filteredServerObj.originalId);
                await query.remove();
              }
              return result;
            default:
              console.log('(Exchange, Merge) Unhandled CRUD type');
              break;
          }
          break;
        default:
          console.log('(Handle Merge Events) Provider not accounted for');
          break;
      }
    } else if (dateIsBefore) {
      console.log(
        'Handle merging here, but for now, discard all pending actions and keep server'
      );

      // Keep server
      await db.events.upsert(filteredServerObj);
      const query = db.pendingactions
        .find()
        .where('eventId')
        .eq(filteredServerObj.originalId);
      await query.remove();

      return editEventSuccess(serverObj);
    }
  } else {
    // Keep server
    db.events.upsert(filteredServerObj);
  }
};
// ------------------------------------ PENDING ACTIONS ------------------------------------ //
