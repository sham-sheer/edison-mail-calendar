import { map, switchMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { of, from } from 'rxjs';
import ICAL from 'ical.js';
import moment from 'moment';
import uniqid from 'uniqid';
import * as CalDavActionCreators from '../actions/caldav';
import * as CalDavDbActionCreators from '../actions/db/caldav';
import getDb from '../db';
import PARSER from '../utils/parser';
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
    switchMap((action) =>
      from(dav.createCalendarObject(action.payload)).pipe(
        map((resp) => CalDavActionCreators.successCreateCalendarObject(resp)),
        catchError((error) => of(CalDavActionCreators.failCreateCalendarObject(error)))
      )
    )
  );

export const updateCalendarObjectEpics = (action$) =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_UPDATE_CALENDAR_OBJECT),
    switchMap((action) =>
      from(updateEventInDb(action.payload)).pipe(
        switchMap((updatedEvent) => {
          debugger;
          const updatedEventJSON = updatedEvent.toJSON();
          const calendarData = createCalData(updatedEvent.ICALString);
          const { caldavUrl, etag } = updatedEventJSON;
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
            map((res) => CalDavActionCreators.successDeleteCalendarObject(res)),
            catchError((error) => of(CalDavActionCreators.failDeleteCalendarObject(error)))
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

const removeEventFromDb = async (eventId) => {
  const db = await getDb();
  try {
    const eventQuery = await db.events
      .find()
      .where('iCalUID')
      .eq(eventId);
    const removedEvent = await eventQuery.remove();
    return removedEvent;
  } catch (e) {
    return e;
  }
};

const updateEventInDb = async (payload) => {
  const db = await getDb();
  try {
    const eventQuery = await db.events
      .find()
      .where('originalId')
      .eq(payload.id)
      .exec();
    const eventJSON = eventQuery[0].toJSON();
    eventJSON.summary = 'Whats next';
    const updatedEvent = await db.events.upsert(eventJSON);
    return updatedEvent;
  } catch (e) {
    return e;
  }
};

const createCalData = (ICALString) => {
  const jcalData = ICAL.parse(ICALString);
  const comp = new ICAL.Component(jcalData);
  const vevent = comp.getFirstSubcomponent('vevent');
  vevent.updatePropertyWithValue('summary', 'Whats next');
  const ICALEventString = comp.toString();
  return ICALEventString;
};
