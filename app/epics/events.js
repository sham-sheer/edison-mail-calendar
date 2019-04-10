import { GET_EVENTS_BEGIN,
  POST_EVENT_BEGIN,
  apiFailure,
  getEventsSuccess,
  postEventSuccess,
  editEventSuccess,
  DELETE_EVENT_BEGIN,
  GET_OUTLOOK_EVENTS_BEGIN,
  CLEAR_ALL_EVENTS,
  EDIT_EVENT_BEGIN,
  getEventsFailure,
  GET_EXCHANGE_EVENTS_BEGIN,

} from '../actions/events';
// import { duplicateAction } from '../actions/db/events';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from,iif,of } from 'rxjs';
import { normalize, schema } from 'normalizr';
import { loadClient,
  loadFullCalendar,
  loadSyncCalendar,
  loadNextPage,
  postGoogleEvent,
  deleteGoogleEvent,
  editGoogleEvent
} from '../utils/client/google';

import * as Providers from '../utils/constants';

import { Client } from '@microsoft/microsoft-graph-client';
import { getUserEvents,getAccessToken,filterEventToOutlook } from '../utils/client/outlook';

import { clearAllEventsSuccess } from '../actions/events';

import * as RxDB from 'rxdb';

import { getAllEvents,createEvent } from '../utils/client/exchange';

import { ExchangeService, Uri, ExchangeCredentials, Appointment, MessageBody, DateTime, WellKnownFolderName, SendInvitationsMode, Item, PropertySet, ItemSchema } from 'ews-javascript-api';
import moment from 'moment';
import getDb from '../db'
import * as ProviderTypes from '../utils/constants'

export const beginGetEventsEpics = action$ => action$.pipe(
  ofType(GET_EVENTS_BEGIN),
  mergeMap(action => iif(() => action.payload !== undefined,
    from(loadClient()).pipe(
      mergeMap(() => {
        return from(setCalendarRequest()).pipe(
          mergeMap(resp => from(eventsPromise(resp)).pipe(
            map((resp) => {
              return getEventsSuccess(resp, Providers.GOOGLE);
            })
          )
          )
        );}
      )
    ),
    of(getEventsFailure("Google user undefined!!"))
  )
  )
);

export const beginEditEventEpics = action$ => action$.pipe(
  ofType(EDIT_EVENT_BEGIN),
  mergeMap(action => from(editEvent(action.payload)).pipe(
     map(resp => editEventSuccess(resp),
     catchError(error => apiFailure(error))
  )
 )
)
);

const editEvent = async (payload) => {
  let calendarObject = payload.data;
  const id = payload.id;
  await loadClient();
  return editGoogleEvent(id, calendarObject);
}

export const beginPostEventEpics = action$ => action$.pipe(
  ofType(POST_EVENT_BEGIN),
  mergeMap(action => {
    if(action.payload.providerType === Providers.GOOGLE) {
      return from(postEvent(action.payload)).pipe(
        map(resp => postEventSuccess([resp.result],action.payload.providerType)),
        catchError(error => apiFailure(error))
      );
    } else if(action.payload.providerType === Providers.OUTLOOK) {
      return from(postEventsOutlook(action.payload)).pipe(
        map(resp => postEventSuccess([resp],action.payload.providerType)),
        catchError(error => apiFailure(error))
      );
    } else if(action.payload.providerType === Providers.EXCHANGE) {
      return from(postEventsExchange(action.payload)).pipe(
        map(resp => postEventSuccess([resp],action.payload.providerType)),
        catchError(error => apiFailure(error))
      );
    }
  })
);

// export const deleteEventEpics = action$ => action$.pipe(
//   ofType(DELETE_EVENT_BEGIN),
//   mergeMap(action => from(deleteEvent(action.payload)).pipe(
//      map(resp => deleteEventSuccess([resp.result]))
//   )
//  )
// )


const postEvent = async (resource) => {
  let calendarObject = {
    'calendarId': 'primary',
    'resource': resource.data
  };
  await loadClient();
  return postGoogleEvent(calendarObject);
};

const postEventsOutlook = (payload) => {
  return new Promise((resolve, reject) => {
    getAccessToken(payload.auth.accessToken, payload.auth.accessTokenExpiry, (accessToken) => {
      if (accessToken) {
      // Create a Graph client
        var client = Client.init({
          authProvider: (done) => {
          // Just return the token
            done(null, accessToken);
          }
        });

        // This first select is to choose from the list of calendars
        resolve(client
          .api('/me/calendars/AAMkAGZlZDEyNmMxLTMyNDgtNDMzZi05ZmZhLTU5ODk3ZjA5ZjQyOABGAAAAAAA-XPNVbhVJSbREEYK0xJ3FBwCK0Ut7mQOxT5W1Wd82ZSuqAAAAAAEGAACK0Ut7mQOxT5W1Wd82ZSuqAAGfLM-yAAA=/events')
          .post(filterEventToOutlook(payload.data)));
      } else {
        var error = { responseText: 'Could not retrieve access token' };
        console.log(error);
        reject(error);
      }
    });
  });
};

const postEventsExchange = (payload) => {
  return new Promise((resolve, reject) => {
    let exch = new ExchangeService();
    exch.Url = new Uri("https://outlook.office365.com/Ews/Exchange.asmx");
    exch.Credentials = new ExchangeCredentials(payload.auth.email, payload.auth.password);

    let newEvent = new Appointment(exch);

    newEvent.Subject = payload.data.summary;
    newEvent.Body = new MessageBody(payload.data.description);
    newEvent.Start = new DateTime(moment.tz(payload.data.start.dateTime,payload.data.start.timezone));
    newEvent.End = new DateTime(moment.tz(payload.data.end.dateTime,payload.data.end.timezone));
    newEvent.Save(WellKnownFolderName.Calendar,SendInvitationsMode.SendToAllAndSaveCopy).then(
      async () => {
        // var item = await Item.Bind(exch, newEvent.Id, new PropertySet(ItemSchema.Subject));
        const db = await getDb();
        const doc = await db.events.upsert(ProviderTypes.filterIntoSchema(newEvent,ProviderTypes.EXCHANGE, payload.auth.email));
        resolve(newEvent);
      }, 
      (error) => reject(error)
      );
  })
}

const deleteEvent = async (id) => {
  await loadClient();
  return deleteGoogleEvent(id);
};

const setCalendarRequest = () => {
  let request;
  let syncToken = localStorage.getItem('sync');
  if(syncToken == null) {
    console.log("Performing full sync");
    request = loadFullCalendar();
  } else {
    console.log("Performing incremental sync");
    request = loadSyncCalendar(syncToken);
  }
  return request;
};

const normalizeEvents = (response) => {
  let singleEvent = new schema.Entity('events');
  let results = normalize({ events : response }, { events: [ singleEvent ]});
  return results;
};

const eventsPromise = async (resp) => {
  const items = [];
  return new Promise((resolve, reject) => {
    fetchEvents(resp, items, resolve, reject);
  });
};

const fetchEvents = (resp, items, resolve, reject) => {
  const newItems = items.concat(resp.result.items);
  if(resp.result.nextPageToken !== undefined) {
    loadNextPage(resp.result.nextPageToken).then(nextResp => {
      return fetchEvents(nextResp, newItems, resolve, reject);
    }).catch(e => {
      if(e.code === 410) {
        console.log('Invalid sync token, clearing event store and re-syncing.');
        localStorage.deleteItem('sync');
        loadFullCalendar()
          .then(newResp => fetchEvents(newResp, items, resolve, reject));
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
export const beginGetOutlookEventsEpics = action$ => action$.pipe(
  ofType(GET_OUTLOOK_EVENTS_BEGIN),
  mergeMap(action =>
    from(new Promise((resolve, reject) => {
      if(action.payload === undefined) {
        reject(getEventsFailure("Outlook user undefined!!"));
      }

      console.log("Outlook Performing full sync", action);
      getUserEvents(action.payload.accessToken, action.payload.accessTokenExpiry, (events, error) => {
        if(error) {
          console.error(error);
          return;
        }

        resolve(events);
      });
    }))
      .pipe(
        map((resp) => {
          return getEventsSuccess(resp, Providers.OUTLOOK, action.payload.email);
        }),
        catchError((error) => {
          return of(error);
        })
      )
  )
);
// ------------------------------------ OUTLOOK ------------------------------------ //


// ------------------------------------ EXCHANGE ------------------------------------ //
export const beginGetExchangeEventsEpics = action$ => action$.pipe(
  ofType(GET_EXCHANGE_EVENTS_BEGIN),
  mergeMap(action => 
    from(new Promise(async (resolve, reject) =>  { 
      if(action.payload === undefined) {
        reject(getEventsFailure("Exchange user undefined!!"));
      }

      resolve(getAllEvents(action.payload.email, action.payload.password, "https://outlook.office365.com/Ews/Exchange.asmx"));
    })).pipe(
      map((resp) => {
        return getEventsSuccess(resp, Providers.EXCHANGE, action.payload.email);
      }),
      catchError((error) => {
        return of(error);
      })
    )
  )
)
// ------------------------------------ EXCHANGE ------------------------------------ //


// ------------------------------------ GENERAL ------------------------------------ //
export const clearAllEventsEpics = action$ => action$.pipe(
  ofType(CLEAR_ALL_EVENTS),
  map(() => {
    localStorage.clear();
    RxDB.removeDatabase('eventsdb', 'idb');
    return clearAllEventsSuccess();
  })
);
// ------------------------------------ GENERAL ------------------------------------ //
