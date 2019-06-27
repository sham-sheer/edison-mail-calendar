import { map, mergeMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { from, forkJoin } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
// import uniqid from 'uniqid';
import uuidv4 from 'uuid';
import {
  WellKnownFolderName,
  SendInvitationsMode,
  ConflictResolutionMode,
  DateTime,
  Recurrence
} from 'ews-javascript-api';
import moment from 'moment';
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
  deleteEventSuccess,
  POST_EVENT_SUCCESS,
  GET_EVENTS_SUCCESS,
  DELETE_EVENT_BEGIN,
  DELETE_EVENT_SUCCESS,
  DELETE_RECURRENCE_SERIES_BEGIN,
  DELETE_RECURRENCE_SERIES_SUCCESS,
  DELETE_FUTURE_RECURRENCE_SERIES_BEGIN
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

export const deleteSingleEventEpics = (action$) =>
  action$.pipe(
    ofType(DELETE_EVENT_BEGIN),
    mergeMap((action) =>
      from(deleteEvent(action.payload)).pipe(
        map((resp) => retrieveStoreEvents(resp.providerType, resp.user))
      )
    )
  );

export const deleteAllRecurrenceEventEpics = (action$) =>
  action$.pipe(
    ofType(DELETE_RECURRENCE_SERIES_BEGIN),
    mergeMap((action) =>
      from(deleteReccurenceEvent(action.payload)).pipe(
        map((resp) => retrieveStoreEvents(resp.providerType, resp.user))
      )
    )
  );

export const deleteFutureRecurrenceEventEpics = (action$) =>
  action$.pipe(
    ofType(DELETE_FUTURE_RECURRENCE_SERIES_BEGIN),
    mergeMap((action) =>
      from(deleteFutureReccurenceEvent(action.payload)).pipe(
        map((resp) => retrieveStoreEvents(resp.providerType, resp.user))
      )
    )
  );

const storeEvents = async (payload) => {
  const db = await getDb();
  const addedEvents = [];
  const dbFindPromises = [];
  const dbUpsertPromises = [];
  const { data } = payload;

  // Create a list of promises to retrieve previous event from db first if it does not exist.
  for (const dbEvent of data) {
    // Filter into our schema object as we need to know how to deal with it for originalId.
    const filteredEvent = Providers.filterIntoSchema(
      dbEvent,
      payload.providerType,
      payload.owner,
      false
    );

    // As id is the uniqid on our side, we need to find and update or delete accordingly.
    // We use filtered object as it has casted it into our schema object type.
    dbFindPromises.push(
      db.events
        .findOne()
        .where('originalId')
        .eq(filteredEvent.originalId)
        .exec()
    );
  }

  // Wait for all the promises to complete
  const results = await Promise.all(dbFindPromises);

  // Assumtion here is that dbFindPromises is going to be the list of query that is our previous data accordingly.
  // dbFindPromises must have same length as results, as its just an array of same size.
  // This ensure the index of data is the same with find query index.
  for (let i = 0; i < results.length; i += 1) {
    const filteredEvent = Providers.filterIntoSchema(
      data[i],
      payload.providerType,
      payload.owner,
      false
    );

    // Means it is a new object, we upsert coz filtered event already is new.
    if (results[i] === null) {
      dbUpsertPromises.push(db.events.upsert(filteredEvent));
    } else {
      // Take back old primary ID, so we do not create another object.
      filteredEvent.id = results[i].id;

      // Push an update query instead of a upsert. Ensure ID is the same.
      dbUpsertPromises.push(
        db.events
          .findOne()
          .where('originalId')
          .eq(filteredEvent.originalId)
          .update({
            $set: filteredEvent
          })
      );
    }

    // This is for all the events, for UI.
    addedEvents.push(filteredEvent);
  }

  await Promise.all(dbUpsertPromises);
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
          uniqueId: uuidv4(),
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

const deleteReccurenceEvent = async (id) => {
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
  console.log(data);

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
        .where('recurringEventId')
        .eq(data.get('recurringEventId'));

      console.log(deleteDoc);

      try {
        // asyncGetSingleExchangeEvent will throw error when no internet or event missing.
        const singleAppointment = await asyncGetSingleExchangeEvent(
          user.email,
          user.password,
          'https://outlook.office365.com/Ews/Exchange.asmx',
          data.get('recurringEventId')
        );

        console.log(singleAppointment);

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
          uniqueId: uuidv4(),
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

const deleteFutureReccurenceEvent = async (id) => {
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
  console.log(data);

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
      // const deleteDoc = db.events
      //   .find()
      //   .where('recurringEventId')
      //   .eq(data.get('recurringEventId'));

      // console.log(deleteDoc);

      try {
        // asyncGetSingleExchangeEvent will throw error when no internet or event missing.
        const recurrMasterAppointment = await asyncGetSingleExchangeEvent(
          user.email,
          user.password,
          'https://outlook.office365.com/Ews/Exchange.asmx',
          data.get('recurringEventId')
        );

        const singleAppointment = await asyncGetSingleExchangeEvent(
          user.email,
          user.password,
          'https://outlook.office365.com/Ews/Exchange.asmx',
          data.get('originalId')
        );

        recurrMasterAppointment.Recurrence.EndDate = singleAppointment.End;
        await asyncDeleteExchangeEvent(singleAppointment, user, () => {
          // Lambda for future if needed.
        });

        await recurrMasterAppointment
          .Update(ConflictResolutionMode.AlwaysOverwrite, SendInvitationsMode.SendToNone)
          .then(async () => {
            console.log('here', data.get('recurringEventId'));

            const allevents = await db.events.find().exec();
            console.log(allevents);

            const removedDeletedEventsLocally = await db.events
              .find()
              .where('recurringEventId')
              .eq(data.get('recurringEventId'))
              .exec();
            console.log(removedDeletedEventsLocally, singleAppointment.End.MomentDate);

            const afterEvents = removedDeletedEventsLocally.filter((event) =>
              moment(event.toJSON().start.dateTime).isAfter(singleAppointment.End.MomentDate)
            );

            await Promise.all(
              afterEvents.map((event) =>
                db.events
                  .find()
                  .where('originalId')
                  .eq(event.originalId)
                  .remove()
              )
            );
            console.log('here?');
            // removedDeletedEventsLocally.
          });
      } catch (error) {
        console.log(error);
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
