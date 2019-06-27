import { map, switchMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { of, from } from 'rxjs';
import ICAL from 'ical.js';
import moment from 'moment';
// import uniqid from 'uniqid';
import * as CalDavActionCreators from '../actions/caldav';
import * as CalDavDbActionCreators from '../actions/db/caldav';
import getDb from '../db';
import PARSER from '../utils/parser';
import * as IcalStringBuilder from '../utils/icalStringBuilder';
import * as Credentials from '../utils/Credentials';

const dav = require('dav');

export const createAccountEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_CREATE_ACCOUNT),
    switchMap((action) =>
      from(dav.createAccount(action.payload)).pipe(
        map((payload) => CalDavActionCreators.successCreateAcount(payload)),
        catchError((error) => of(CalDavActionCreators.failCreateAccount(error)))
      )
    )
  );

export const triggerStoreCalDavEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.SUCCESS_CREATE_ACCOUNT),
    map((action) => CalDavDbActionCreators.beginStoreCaldavObjects(action.payload))
  );

export const createCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_CREATE_CALENDAR_OBJECT),
    switchMap((action) => {
      debugger;
      return from(dav.createCalendarObject(action.payload)).pipe(
        map((resp) => CalDavActionCreators.successCreateCalendarObject(resp)),
        catchError((error) => of(CalDavActionCreators.failCreateCalendarObject(error)))
      );
    })
  );

export const updateCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_UPDATE_CALENDAR_OBJECT),
    switchMap((action) =>
      from(updateEventInDb(action.payload)).pipe(
        switchMap((updatedEvent) => {
          const calendarData = updatedEvent.ICALString;
          const { caldavUrl, etag } = updatedEvent;
          const xhrObject = new dav.transport.Basic(
            new dav.Credentials({
              username: Credentials.ICLOUD_USERNAME,
              password: Credentials.ICLOUD_PASSWORD
            })
          );
          const option = {
            xhr: xhrObject,
            contentType: 'text/calendar; charset=utf-8'
          };
          const calendarObject = {
            url: caldavUrl,
            etag,
            calendarData
          };
          debugger;
          return from(dav.updateCalendarObject(calendarObject, option)).pipe(
            map((res) => CalDavActionCreators.successUpdateCalendarObject(res)),
            catchError((error) => of(CalDavActionCreators.failUpdateCalendarObject(error)))
          );
        }),
        catchError((error) => of(CalDavActionCreators.failUpdateCalendarObject(error)))
      )
    )
  );

export const deleteCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_DELETE_CALENDAR_OBJECT),
    switchMap((action) =>
      from(removeEventFromDb(action.payload)).pipe(
        switchMap((resp) => {
          const respJSON = resp[0].toJSON();
          const calendarObject = {
            etag: respJSON.etag,
            url: respJSON.caldavUrl
          };
          const xhrObject = new dav.transport.Basic(
            new dav.Credentials({
              username: Credentials.ICLOUD_USERNAME,
              password: Credentials.ICLOUD_PASSWORD
            })
          );
          const option = {
            xhr: xhrObject
          };
          return from(dav.deleteCalendarObject(calendarObject, option)).pipe(
            map((res) => CalDavActionCreators.successDeleteCalendarObject(res)),
            catchError((error) => of(CalDavActionCreators.failDeleteCalendarObject(error)))
          );
        }),
        catchError((error) => of(CalDavActionCreators.failDeleteCalendarObject(error)))
      )
    )
  );

export const successDeleteCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.SUCCESS_DELETE_CALENDAR_OBJECT),
    map(() => ({
      type: 'BEGIN_RETRIEVE_CALDAV_EVENTS'
    }))
  );

export const failDeleteCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.FAIL_DELETE_CALENDAR_OBJECT),
    map((action) => console.log(`Failed to delete Event. Error: ${action.error}`))
  );

const removeEventFromDb = async (payload) => {
  const db = await getDb();
  try {
    const eventToRemove = await db.events
      .find()
      .where('iCalUID')
      .eq(payload);
    const removedEvent = await eventToRemove.remove();
    return removedEvent;
  } catch (e) {
    return e;
  }
};

const updateEventInDb = async (payload) => {
  const db = await getDb();
  try {
    // find event from Database
    const rxEvent = await db.events
      .find()
      .where('iCalUID')
      .eq(payload.iCalUID)
      .exec();
    let string = '';
    // const { ICALString } = rxEvent[0];
    // const jcalData = ICAL.parse(ICALString);
    // const comp = new ICAL.Component(jcalData);
    // const vevent = comp.getFirstSubcomponent('vevent');
    // const entries = Object.entries(payload.eventObject);
    switch (payload.type) {
      case 'UPDATE_SERIES_RECUR':
      case 'UPDATE_SINGLE':
        await rxEvent[0].update({
          $set: payload.eventObject
        });
        await rxEvent[0].update({
          $set: {
            ICALString: IcalStringBuilder.buildICALStringUpdateAll(rxEvent[0])
          }
        });
        return rxEvent[0].toJSON();
      case 'DELETE_SINGLE_RECUR':
        const recurPattern = await db.recurrencepatterns
          .find()
          .where('originalId')
          .eq(payload.iCalUID)
          .exec();
        await recurPattern[0].update({
          $set: {
            exDates: [...recurPattern[0].exDates, payload.eventObject.exdate]
          }
        });
        string = IcalStringBuilder.buildICALStringDeleteRecurEvent(
          recurPattern,
          payload.eventObject.exdate,
          rxEvent[0]
        );
        await rxEvent[0].update({
          $set: {
            ICALString: string
          }
        });
        debugger;
        return rxEvent[0].toJSON();
      case 'UPDATE_SINGLE_RECUR':
        const eventObj = payload.eventObject;
        const recurPatternToUpdate = await db.recurrencepatterns
          .find()
          .where('originalId')
          .eq(payload.iCAlUID)
          .exec();
        await recurPatternToUpdate[0].update({
          $set: {
            recurrenceIds: [
              ...recurPatternToUpdate[0].recurrenceIds,
              payload.eventObject.start.dateTime
            ]
          }
        });
        await rxEvent[0].update({
          $set: {
            ICALString: IcalStringBuilder.buildICALStringUpdateOnly(payload.eventObject, rxEvent[0])
          }
        });
        return rxEvent[0];
      default:
        return payload;
    }
  } catch (e) {
    return e;
  }
};

// const updateEventInDb = async payload => {
//   const db = await getDb();
//   try {
//     const updatedEvent = await db.events
//       .find()
//       .where('iCalUID')
//       .eq(payload.iCalUID)
//       .exec();
//     const eventRx = updatedEvent[0];
//     const { ICALString } = eventRx;
//     let newICALString = '';
//     if (payload.exdate || payload.until) {
//       newICALString = processSingleRecurEventICALString(ICALString, payload);
//     } else {
//       newICALString = processSingleEventICALString(ICALString, payload);
//     }
//     payload = Object.assign({}, payload, {
//       ...payload,
//       ICALString: newICALString
//     });
//     debugger;
//     await updatedEvent[0].update({
//       $set: payload
//     });
//     return updatedEvent[0];
//   } catch (e) {
//     return e;
//   }
// };

const processSingleEventICALString = (ICALString, payload) => {
  const payloadForCalDav = processPayloadForCaldav(payload);
  const jcalData = ICAL.parse(ICALString);
  const comp = new ICAL.Component(jcalData);
  const vevent = comp.getFirstSubcomponent('vevent');
  const entries = Object.entries(payloadForCalDav);
  entries.forEach((entry) => vevent.updatePropertyWithValue(entry[0], entry[1]));
  const ICALEventString = comp.toString();
  return ICALEventString;
};

const processPayloadForCaldav = (payload) => {
  const payloadForCalDav = Object.assign({}, payload, {
    ...payload,
    dtstart: payload.start.dateTime,
    dtend: payload.end.dateTime
  });
  delete payloadForCalDav.iCalUID;
  delete payloadForCalDav.start;
  delete payloadForCalDav.end;
  return payloadForCalDav;
};

const processSingleRecurEventICALString = (ICALString, payload) => {
  const jcalData = ICAL.parse(ICALString);
  const comp = new ICAL.Component(jcalData);
  const vevent = comp.getFirstSubcomponent('vevent');
  vevent.updatePropertyWithValue('exdate', payload.exdate);
  const ICALEventString = comp.toString();
  debugger;
  return ICALEventString;
};
