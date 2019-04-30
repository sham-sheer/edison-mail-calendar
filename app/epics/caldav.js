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

const dav = require('dav');

export const createAccountEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_CREATE_ACCOUNT),
    switchMap(action =>
      from(dav.createAccount(action.payload)).pipe(
        map(payload => CalDavActionCreators.successCreateAcount(payload)),
        catchError(error => of(CalDavActionCreators.failCreateAccount(error)))
      )
    )
  );

export const triggerStoreCalDavEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.SUCCESS_CREATE_ACCOUNT),
    map(action =>
      CalDavDbActionCreators.beginStoreCaldavObjects(action.payload)
    )
  );

export const createCalendarObjectEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_CREATE_CALENDAR_OBJECT),
    switchMap(action =>
      from(dav.createCalendarObject(action.payload)).pipe(
        map(resp => CalDavActionCreators.successCreateCalendarObject(resp)),
        catchError(error =>
          of(CalDavActionCreators.failCreateCalendarObject(error))
        )
      )
    )
  );

export const updateCalendarObjectEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_UPDATE_CALENDAR_OBJECT),
    switchMap(action =>
      from(dav.updateCalendarObject(action.payload)).pipe(
        map(resp => CalDavActionCreators.successUpdateCalendarObject(resp)),
        catchError(error =>
          of(CalDavActionCreators.failUpdateCalendarObject(error))
        )
      )
    )
  );

export const deleteCalendarObjectEpics = action$ =>
  action$.pipe(
    ofType(CalDavActionCreators.BEGIN_DELETE_CALENDAR_OBJECT),
    switchMap(action =>
      from(dav.deleteCalendarObject(action.payload)).pipe(
        map(resp => CalDavActionCreators.successDeleteCalendarObject(resp)),
        catchError(error =>
          of(CalDavActionCreators.failDeleteCalendarObject(error))
        )
      )
    )
  );

export const storeAccountEpics = action$ =>
  action$.pipe(
    ofType(CalDavDbActionCreators.BEGIN_STORE_CALDAV_OBJECTS),
    switchMap(action =>
      from(storeCaldav(action.payload)).pipe(
        map(payload =>
          CalDavDbActionCreators.successStoreCaldavObjects(payload)
        ),
        catchError(error =>
          of(CalDavDbActionCreators.failStoreCaldavObjects(error))
        )
      )
    )
  );

const storeCaldav = async payload => {
  const db = await getDb();
  try {
    const calendars = PARSER.parseCal(payload.calendars);
    const events = PARSER.parseCalEvents(payload.calendars);
    const flatEvents = events.reduce((acc, val) => acc.concat(val), []);
    const eventPersons = PARSER.parseEventPersons(flatEvents);
    const recurrenceEvents = PARSER.parseRecurrenceEvents(flatEvents);
    const promises = [];
    calendars.forEach(calendar => {
      promises.push(db.calendars.upsert(calendar));
    });
    flatEvents.forEach(calEvent => {
      promises.push(db.events.upsert(calEvent.data));
    });
    eventPersons.forEach(eventPerson => {
      promises.push(db.eventpersons.upsert(eventPerson));
    });
    recurrenceEvents.forEach(recurrenceEvent => {
      promises.push(db.recurrencepatterns.upsert(recurrenceEvent));
    });
    return await Promise.all(promises);
  } catch (e) {
    throw e;
  }
};
