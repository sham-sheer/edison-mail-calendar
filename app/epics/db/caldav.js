import { map, switchMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { of, from } from 'rxjs';
import * as CalDavDbActionCreators from '../../actions/db/caldav';
import getDb from '../../db';

const dav = require('dav');
const ICAL = require('ical.js');

const retrieveEventsEpic = action$ =>
  action$.pipe(
    ofType(CalDavDbActionCreators.RETRIEVE_CALENDARS),
    switchMap(action =>
      from(getDb()).pipe(
        switchMap(db =>
          from(db.calendars.find().exec()).pipe(
            map(results => console.log('Hello'))
          )
        )
      )
    )
  );

export default retrieveEventsEpic;
