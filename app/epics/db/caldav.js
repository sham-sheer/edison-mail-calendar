import { map, switchMap, catchError } from 'rxjs/operators';
import { ofType } from 'redux-observable';
import { of, from } from 'rxjs';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import moment from 'moment';
import * as CalDavDbActionCreators from '../../actions/db/caldav';
import { BEGIN_RETRIEVE_CALDAV_EVENTS } from '../../actions/caldav';
import getDb from '../../db';
import { updateStoredEvents } from '../../actions/db/events';
import PARSER from '../../utils/parser';

const dav = require('dav');
const ICAL = require('ical.js');

export const retrieveCaldavEventsEpic = action$ =>
  action$.pipe(
    ofType(BEGIN_RETRIEVE_CALDAV_EVENTS),
    switchMap(action =>
      from(getDb()).pipe(
        switchMap(db =>
          from(db.events.find().exec()).pipe(
            // map(events =>
            //   events.filter(
            //     singleEvent => singleEvent.providerType === action.payload
            //   )
            // ),
            map(events =>
              events.map(singleEvent => ({
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
                isModifiedThenDeleted: singleEvent.isModifiedThenDeleted
              }))
            ),
            // map(events => updateStoredEvents(events))
            switchMap(results =>
              from(expandRecurEvents(results)).pipe(
                switchMap(result =>
                  from(result[0]).pipe(
                    map(expandedEvents => updateStoredEvents(expandedEvents))
                  )
                )
              )
            )
          )
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

const expandRecurEvents = async results => {
  const db = await getDb();
  const nonMTDresults = results.filter(result => !result.isModifiedThenDeleted);
  const recurringEvents = nonMTDresults.filter(
    nonMTDresult => nonMTDresult.isRecurring
  );
  let merged = nonMTDresults;
  const finalResults = recurringEvents.map(async recurMasterEvent => {
    // const recurPatternOriginalIds = await db.recurrencepatterns
    //   .find()
    //   .where('originalId')
    //   .eq(recurMasterEvent.originalId)
    //   .exec();
    const recurPatternRecurId = await db.recurrencepatterns
      .find()
      .where('recurringTypeId')
      .eq(recurMasterEvent.start.dateTime)
      .exec();
    const recurTemp = parseRecurrence(
      recurPatternRecurId[0].toJSON(),
      recurMasterEvent
    );
    merged = [...merged, recurTemp];
    const final = merged.reduce((acc, val) => acc.concat(val), []);
    // debugger;
    return final;
  });
  return finalResults;
};

const parseRecurrence = (pattern, recurMasterEvent) => {
  const recurEvents = [];
  const rule = createRule(pattern, recurMasterEvent);
  const recurDates = rule.all().map(date => date.toJSON());
  const duration = getDuration(recurMasterEvent);
  recurDates.forEach(recurDateTime => {
    const start = {
      dateTime: recurDateTime,
      timezone: 'timezone'
    };
    const end = {
      dateTime: moment(start.dateTime)
        .add(duration)
        .toISOString(),
      timezone: 'timezone'
    };
    recurEvents.push({
      id: recurMasterEvent.id,
      end,
      start,
      summary: recurMasterEvent.summary,
      organizer: recurMasterEvent.organizer,
      recurrence: recurMasterEvent.recurrence,
      iCalUID: recurMasterEvent.iCalUID,
      attendees: recurMasterEvent.attendee,
      originalId: recurMasterEvent.originalId,
      creator: recurMasterEvent.creator,
      isRecurring: recurMasterEvent.isRecurring
    });
  });
  return recurEvents;
};

const createRule = (pattern, master) => {
  const modifiedThenDeleted = [];
  const rruleSet = new RRuleSet();
  let until = '';
  if (pattern.until) {
    until = new Date(pattern.until);
  } else {
    until = new Date(2020, 12, 12);
  }
  switch (pattern.freq) {
    case 'MONTHLY':
      rruleSet.rrule(
        new RRule({
          freq: RRule.MONTHLY,
          interval: pattern.interval,
          dtstart: new Date(master.start.dateTime),
          until
        })
      );
      break;
    case 'YEARLY':
      rruleSet.rrule(
        new RRule({
          freq: RRule.YEARLY,
          interval: pattern.interval,
          dtstart: new Date(master.start.dateTime),
          until
        })
      );
      break;
    case 'DAILY':
      rruleSet.rrule(
        new RRule({
          freq: RRule.DAILY,
          interval: pattern.interval,
          dtstart: new Date(master.start.dateTime),
          until
        })
      );
      break;
    case 'WEEKLY':
      rruleSet.rrule(
        new RRule({
          freq: RRule.WEEKLY,
          interval: pattern.interval,
          dtstart: new Date(master.start.dateTime),
          until
        })
      );
      break;
    default:
      rruleSet.rrule(
        new RRule({
          freq: RRule.WEEKLY,
          interval: pattern.interval,
          dtstart: new Date(master.start.dateTime),
          until: new Date(pattern.until)
        })
      );
      break;
  }
  const exdates = pattern.exDates;
  const recurdates = pattern.recurrenceIds;
  exdates.forEach(exdate => {
    recurdates.forEach(recurdate => {
      if (exdate[3] === recurdate[3]) {
        modifiedThenDeleted.push(exdate);
      }
    });
  });
  exdates.forEach(exdate => rruleSet.exdate(new Date(exdate[3])));
  recurdates.forEach(recurdate => rruleSet.exdate(new Date(recurdate[3])));
  rruleSet.exdate(new Date(master.start.dateTime));
  return rruleSet;
};

const getDuration = master => {
  const start = moment(master.start.dateTime);
  const end = moment(master.end.dateTime);
  return moment.duration(end.diff(start));
};

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
