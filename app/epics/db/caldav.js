import { map, switchMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { of, from, merge } from 'rxjs';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import moment from 'moment';
import * as CalDavDbActionCreators from '../../actions/db/caldav';
import { BEGIN_RETRIEVE_CALDAV_EVENTS } from '../../actions/caldav';
import getDb from '../../db';
import { updateStoredEvents } from '../../actions/db/events';
import PARSER from '../../utils/parser';

const dav = require('dav');
const ICAL = require('ical.js');

export const retrieveCaldavEventsEpic = (action$) =>
  action$.pipe(
    ofType(BEGIN_RETRIEVE_CALDAV_EVENTS),
    switchMap((action) =>
      from(getDb()).pipe(
        switchMap((db) =>
          from(db.events.find().exec()).pipe(
            // map(events =>
            //   events.filter(
            //     singleEvent => singleEvent.providerType === action.payload
            //   )
            // ),
            map((events) =>
              events.map((singleEvent) => ({
                id: singleEvent.id,
                end: singleEvent.end,
                start: singleEvent.start,
                summary: singleEvent.summary,
                organizer: singleEvent.organizer,
                recurrence: singleEvent.recurrence,
                iCalUID: singleEvent.iCalUID,
                attendees: singleEvent.attendee,
                originalId: singleEvent.originalId,
                creator: singleEvent.creator,
                isRecurring: singleEvent.isRecurring,
                isModifiedThenDeleted: singleEvent.isModifiedThenDeleted,
                hide: singleEvent.hide,
                providerType: singleEvent.providerType
              }))
            ),
            // map(events => updateStoredEvents(events))
            switchMap((results) =>
              from(PARSER.expandRecurEvents(results)).pipe(
                switchMap((resultPromises) =>
                  merge(resultPromises).pipe(
                    switchMap((eventPromises) =>
                      from(eventPromises).pipe(
                        map((events) => {
                          console.log(events);
                          return updateStoredEvents(events);
                        })
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );

export const storeAccountEpics = (action$) =>
  action$.pipe(
    ofType(CalDavDbActionCreators.BEGIN_STORE_CALDAV_OBJECTS),
    switchMap((action) =>
      from(storeCaldav(action.payload)).pipe(
        map((payload) => CalDavDbActionCreators.successStoreCaldavObjects(payload)),
        catchError((error) => of(CalDavDbActionCreators.failStoreCaldavObjects(error)))
      )
    )
  );

const storeCaldav = async (payload) => {
  const db = await getDb();
  try {
    const calendars = PARSER.parseCal(payload.calendars);
    const events = PARSER.parseCalEvents(payload.calendars);
    const flatEvents = events.reduce((acc, val) => acc.concat(val), []);
    const eventPersons = PARSER.parseEventPersons(flatEvents);
    const recurrenceEvents = PARSER.parseRecurrenceEvents(flatEvents);
    const promises = [];
    calendars.forEach((calendar) => {
      promises.push(db.calendars.upsert(calendar));
    });
    flatEvents.forEach((calEvent) => {
      promises.push(db.events.upsert(calEvent.data));
    });
    eventPersons.forEach((eventPerson) => {
      promises.push(db.eventpersons.upsert(eventPerson));
    });
    recurrenceEvents.forEach((recurrenceEvent) => {
      promises.push(db.recurrencepatterns.upsert(recurrenceEvent));
    });
    return await Promise.all(promises);
  } catch (e) {
    throw e;
  }
};
