import { map, mergeMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from, forkJoin } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import uniqid from 'uniqid';
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
  DELETE_EVENT_SUCCESS,
  deleteEventSuccess
} from '../../actions/events';
import { deleteGoogleEvent, loadClient } from '../../utils/client/google';
import { asyncGetSingleExchangeEvent, asyncDeleteExchangeEvent } from '../../utils/client/exchange';
import getDb from '../../db';
import * as Providers from '../../utils/constants';

export const retrieveEventsEpic = (action$) =>
  action$.pipe(
    ofType(RETRIEVE_STORED_EVENTS),
    mergeMap((action) =>
      from(getDb()).pipe(
        mergeMap((db) =>
          from(db.events.find().exec()).pipe(
            map((events) =>
              events.filter(
                (singleEvent) => singleEvent.providerType === action.payload.providerType
              )
            ),
            map((events) =>
              events.map((singleEvent) => ({
                id: singleEvent.id,
                end: singleEvent.end,
                start: singleEvent.start,
                summary: singleEvent.summary,
                organizer: singleEvent.organizer,
                recurrence: singleEvent.recurrence,
                iCalUID: singleEvent.iCalUID,
                attendees: singleEvent.attendees,
                originalId: singleEvent.originalId,
                owner: singleEvent.owner,
                hide: singleEvent.hide
              }))
            ),
            map((results) => updateStoredEvents(results, action.payload.user))
          )
        )
      )
    )
  );

export const storeEventsEpic = (action$) =>
  action$.pipe(
    ofType(BEGIN_STORE_EVENTS),
    mergeMap((action) =>
      from(storeEvents(action.payload)).pipe(
        map((results) => successStoringEvents(results)),
        catchError((error) => failStoringEvents(error))
      )
    )
  );

export const beginStoreEventsEpic = (action$) =>
  action$.pipe(
    ofType(POST_EVENT_SUCCESS, GET_EVENTS_SUCCESS),
    map((action) => beginStoringEvents(action.payload))
  );

export const deleteEventEpics = (action$) =>
  action$.pipe(
    ofType(DELETE_EVENT_BEGIN),
    mergeMap((action) =>
      from(deleteEvent(action.payload)).pipe(
        map((resp) => retrieveStoreEvents(resp.providerType, resp.user))
      )
    )
  );

const storeEvents = async (payload) => {
  const db = await getDb();
  const addedEvents = [];
  const dbUpsertPromises = [];
  const { data } = payload;

  for (const dbEvent of data) {
    // #TO-DO, we need to figure out how to handle recurrence, for now, we ignore
    if (dbEvent.recurringEventId !== undefined && dbEvent.recurringEventId !== null) {
      continue;
    }

    const filteredEvent = Providers.filterIntoSchema(
      dbEvent,
      payload.providerType,
      payload.owner,
      false
    );
    filteredEvent.providerType = payload.providerType;
    // console.log(dbEvent, filteredEvent);
    try {
      dbUpsertPromises.push(db.events.upsert(filteredEvent));
    } catch (e) {
      return e;
    }

    // Adding filtered event coz if I added dbEvent, it will result it non compatability with outlook objects.
    addedEvents.push(filteredEvent);
  }

  Promise.all(dbUpsertPromises);
  return addedEvents;
};

const deleteEvent = async (id) => {
  // Get database
  const db = await getDb();
  const query = db.events
    .find()
    .where('id')
    .eq(id);

  // Find the proper item on database
  const datas = await query.exec();
  if (datas.length !== 1) {
    console.error('Omg, actually a collision?');
  }
  const data = datas[0];

  // Find the proper user on database
  const users = await db.persons
    .find()
    .where('providerType')
    .eq(datas[0].providerType)
    .where('email')
    .eq(datas[0].owner)
    .exec();

  if (users.length !== 1) {
    console.error('Omg, actually a collision?');
  }
  const user = users[0];

  // Edge case, means user created an event offline, and is yet to upload it to service.
  // In that case, we shuld remove it from pending action if it exists.
  if (data.local === true) {
    const pendingactionRemoval = db.pendingactions
      .find()
      .where('eventId')
      .eq(data.originalId);

    await pendingactionRemoval.remove();
    await query.remove();

    return {
      providerType: data.providerType,
      user: Providers.filterUsersIntoSchema(user)
    };
  }

  // Based off which provider, we will have different delete functions.
  switch (data.providerType) {
    case Providers.GOOGLE:
      await loadClient();
      const responseFromAPI = await deleteGoogleEvent(data.get('originalId'));
      await query.remove();
      break;
    case Providers.OUTLOOK:
      console.log('Outlook, To-Do delete feature');
      break;
    case Providers.EXCHANGE:
      const deleteDoc = db.events
        .find()
        .where('originalId')
        .eq(data.get('originalId'));
      try {
        // asyncGetSingleExchangeEvent will throw error when no internet or event missing.
        const singleAppointment = await asyncGetSingleExchangeEvent(
          user.email,
          user.password,
          'https://outlook.office365.com/Ews/Exchange.asmx',
          data.get('originalId')
        );

        await asyncDeleteExchangeEvent(singleAppointment, user, () => {
          // Lambda for future if needed.
        });

        await deleteDoc.remove();
      } catch (error) {
        // This means item has been deleted on server, maybe by another user
        // Handle this differently.
        if (error.ErrorCode === 249) {
          // Just remove it from database instead, and break;
          await deleteDoc.remove();
          break;
        }

        // Upsert it to the pending action, let pending action automatically handle it.
        db.pendingactions.upsert({
          uniqueId: uniqid(),
          eventId: data.get('originalId'),
          status: 'pending',
          type: 'delete'
        });

        // Hide the item, and set it to local as it has been updated.
        await deleteDoc.update({
          $set: {
            hide: true,
            local: true
          }
        });
      }
      break;
    default:
      console.log(`Delete feature for ${data.providerType} not handled`);
      break;
  }

  // Return which user has been edited.
  return {
    providerType: data.providerType,
    user: Providers.filterUsersIntoSchema(user)
  };
};
