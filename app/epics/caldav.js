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
