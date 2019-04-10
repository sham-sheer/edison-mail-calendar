import { map,
  mergeMap,
  // switchMap,
  catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from } from 'rxjs';
import {
  RETRIEVE_STORED_EVENTS,
  BEGIN_STORE_EVENTS,
  duplicateAction,
  updateStoredEvents,
  successStoringEvents,
  failStoringEvents,
  beginStoringEvents,
  retrieveStoreEvents
} from '../../actions/db/events';
import {
  POST_EVENT_SUCCESS,
  GET_EVENTS_SUCCESS,
  DELETE_EVENT_BEGIN,
} from '../../actions/events';
import {
  deleteGoogleEvent,
  loadClient
} from '../../utils/client/google';
import getDb from '../../db';
import * as Providers from '../../utils/constants';

export const retrieveEventsEpic = action$ => action$.pipe(
  ofType(RETRIEVE_STORED_EVENTS),
  mergeMap((action) => from(getDb()).pipe(
    mergeMap(db => from(db.events.find().exec()).pipe(
      map(events => events.filter(singleEvent => {
        return singleEvent.providerType === action.providerType;
      })),
      map(events => events.map(singleEvent => {
        return {
          'id' : singleEvent.id,
          'end' : singleEvent.end,
          'start': singleEvent.start,
          'summary': singleEvent.summary,
          'organizer': singleEvent.organizer,
          'recurrence': singleEvent.recurrence,
          'iCalUID': singleEvent.iCalUID,
          'attendees': singleEvent.attendees,
          'originalId': singleEvent.originalId
        };
      })
      ),
      map(results => {
        return updateStoredEvents(results);
      })
    )
    )
  ),
  ),
);

export const storeEventsEpic = action$ => action$.pipe(
  ofType(BEGIN_STORE_EVENTS),
  mergeMap((action) => from(storeEvents(action.payload)).pipe(
    map(results => successStoringEvents(results)),
    catchError(error => failStoringEvents(error))
  ))
);

export const beginStoreEventsEpic = action$ => action$.pipe(
  ofType(POST_EVENT_SUCCESS, GET_EVENTS_SUCCESS),
  map((action) => {
    // console.log(action.payload);
    return beginStoringEvents(action.payload);
  })
);

export const deleteEventEpics = action$ => action$.pipe(
  ofType(DELETE_EVENT_BEGIN),
  mergeMap((action) => from(deleteEvent(action.payload)).pipe(
    map(() => retrieveStoreEvents()),
  )
  ),
);


const storeEvents = async (payload) => {
  const db = await getDb();
  const addedEvents = [];
  const data = payload.data;
  // console.log(payload);
  for(let dbEvent of data) {
    // #TO-DO, we need to figure out how to handle recurrence, for now, we ignore
    if(dbEvent.recurringEventId !== undefined && dbEvent.recurringEventId !== null) {
      continue;
    }

    let filteredEvent = Providers.filterIntoSchema(dbEvent, payload.providerType, payload.owner);
    filteredEvent['providerType'] = payload.providerType;
    try {
      await db.events.upsert(filteredEvent);
    }
    catch(e) {
      return e;
    }

    // Adding filtered event coz if I added dbEvent, it will result it non compatability with outlook objects.
    addedEvents.push(filteredEvent);
  }
  return addedEvents;
};



const deleteEvent = async (id) => {
  const db = await getDb();
  await loadClient();
  const query = db.events.find().where("id").eq(id);
  const originalDocument = await query.exec();
  const originalId = originalDocument[0].get("originalId");
  const responseFromAPI = await deleteGoogleEvent(originalId);
  await query.remove();
};
