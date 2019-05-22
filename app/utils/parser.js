import React from 'react';
import ICAL from 'ical.js';
import moment from 'moment';
import uniqid from 'uniqid';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import getDb from '../db';

const TEMPORARY_RECURRENCE_END = new Date(2020, 12, 12);

const parseRecurrenceEvents = calEvents => {
  const recurringEvents = [];
  calEvents.forEach(calEvent => {
    const { isRecurring } = calEvent.data;
    if (isRecurring) {
      recurringEvents.push({
        id: uniqid(),
        originalId: calEvent.data.originalId,
        freq: calEvent.rruleJSON.freq,
        interval: calEvent.recurringInterval,
        recurringTypeId: calEvent.data.start.dateTime,
        until: calEvent.rruleJSON.until,
        exDates: calEvent.exDates,
        recurrenceIds: calEvent.recurrenceIds,
        modifiedThenDeleted: calEvent.mtd
      });
    }
  });
  return recurringEvents;
};

const parseEventPersons = events => {
  const eventPersons = [];
  events.forEach(calEvent => {
    const attendees = calEvent.data.attendee;
    if (attendees.length > 0) {
      // if there are attendees
      attendees.forEach(attendee => {
        eventPersons.push({
          eventPersonId: uniqid(),
          // this is null when status of event is not confirmed
          eventId: calEvent.data.id,
          // Update: Gonna use email as the personId
          personId:
            attendee.email !== undefined ? attendee.email : attendee.action
        });
      });
    }
  });
  return eventPersons;
};

const parseCal = calendars => {
  const parsedCalendars = calendars.map(calendar => ({
    calendarId: calendar.data.href,
    ownerId: calendar.account.credentials.username,
    name: calendar.displayName,
    description: calendar.description,
    timezone: calendar.timezone
  }));
  return parsedCalendars;
};

const parseCalEvents = calendars => {
  const events = [];
  calendars.forEach(calendar => {
    events.push(
      parseEvents(
        calendar.objects,
        calendar.data.href,
        calendar.account.credentials.username
      )
    );
  });
  return events;
};

const parseEvents = (events, calendarId, creator) => {
  const parsedEvents = [];
  events.forEach(calevent => {
    if (calevent.calendarData !== undefined) {
      const jcalData = ICAL.parse(calevent.calendarData);
      const ics = calevent.data.href;
      const { etag, url } = calevent;
      let mtd = false;
      if (jcalData.length > 0) {
        const comp = new ICAL.Component(jcalData);
        const compString = comp.toString();
        const vevents = comp.getAllSubcomponents('vevent');
        const modifiedOccurences = [];
        const recurrenceIds = [];
        // vevents.forEach((evt, index) => {
        //   // Contains all modified occurences
        //   if (evt.getFirstPropertyValue('recurrence-id')) {
        //     modifiedOccurences.push({
        //       'recurrence-id': evt.getFirstPropertyValue('recurrence-id'),
        //       key: index
        //     });
        //   }
        // });
        vevents.forEach((evt, index) => {
          // Contains all modified occurences
          if (evt.getFirstPropertyValue('recurrence-id')) {
            recurrenceIds.push(evt.getFirstProperty('recurrence-id').jCal);
          }
        });
        const vevent = comp.getFirstSubcomponent('vevent');
        const ICALEvent = new ICAL.Event(vevent);
        let attendees = [];
        let recurringInterval = '';
        let rruleJSON = {};
        const exDates = [];

        if (vevent.hasProperty('exdate')) {
          const exdateProps = vevent.getAllProperties('exdate');
          exdateProps.forEach(exdate => exDates.push(exdate.jCal));
        }

        if (vevent.hasProperty('attendee')) {
          attendees = parseAttendees(vevent.getAllProperties('attendee'));
        }

        if (ICALEvent.isRecurring()) {
          // const recurringEvents = expandRecurringEvent(
          //   vevents,
          //   vevent,
          //   ICALEvent,
          //   modifiedOccurences,
          //   ics,
          //   attendees,
          //   etag
          // );
          const rrule = vevent.getFirstPropertyValue('rrule');
          recurringInterval = rrule.interval;
          rruleJSON = rrule.toJSON();
        }

        if (recurrenceIds.length === 0) {
          const eventParsed = parseICALEvent(
            vevent,
            attendees,
            ICALEvent.isRecurring(),
            calendarId,
            creator,
            mtd,
            etag,
            url,
            compString
          );
          parsedEvents.push({
            ics,
            etag,
            rruleJSON,
            recurringInterval,
            exDates,
            recurrenceIds,
            data: eventParsed
          });
        } else {
          vevents.forEach(recurvevent => {
            mtd = isModifiedThenDeleted(recurvevent, exDates);
            const eventParsed = parseICALEvent(
              recurvevent,
              attendees,
              ICALEvent.isRecurring(),
              calendarId,
              creator,
              mtd,
              etag,
              url,
              compString
            );
            parsedEvents.push({
              ics,
              etag,
              rruleJSON,
              recurringInterval,
              exDates,
              recurrenceIds,
              data: eventParsed
            });
          });
        }
      }
    }
  });
  return parsedEvents;
};

const isModifiedThenDeleted = (recurEvent, exDates) => {
  let isMtd = false;
  if (exDates === 0 || !recurEvent.hasProperty('recurrence-id')) {
    return isMtd;
  }
  const recurId = recurEvent.getFirstProperty('recurrence-id').jCal[3];
  exDates.forEach(exdate => {
    if (exdate[3] === recurId) {
      isMtd = true;
      return isMtd;
    }
  });
  return isMtd;
};

const parseICALEvent = (
  vevent,
  attendee,
  isRecurring,
  calendarId,
  creator,
  mtd,
  etag,
  url,
  compString
) => {
  const dtstart = vevent.getFirstPropertyValue('dtstart');
  const dtend = vevent.getFirstPropertyValue('dtend');

  return {
    id: uniqid(),
    start: {
      dateTime: new Date(dtstart).toISOString(),
      timezone: 'timezone'
    },
    end: {
      dateTime: new Date(dtend).toISOString(),
      timezone: 'timezone'
    },
    originalId: vevent.getFirstPropertyValue('uid'),
    created: new Date(vevent.getFirstPropertyValue('created')).toISOString(),
    updated: new Date(
      vevent.getFirstPropertyValue('last-modified')
    ).toISOString(),
    summary: vevent.getFirstPropertyValue('summary'),
    description:
      vevent.getFirstPropertyValue('description') == null
        ? ''
        : vevent.getFirstPropertyValue('description'),
    location:
      vevent.getFirstPropertyValue('location') == null
        ? ''
        : vevent.getFirstPropertyValue('location'),
    creator,
    organizer:
      vevent.getFirstPropertyValue('organizer') == null
        ? creator
        : vevent.getFirstPropertyValue('organizer'),
    originalStartTime: {
      dateTime: new Date(dtstart).toISOString(),
      timezone: 'timezone'
    },
    attendee,
    calendarId,
    providerType: 'caldav',
    isRecurring,
    isModifiedThenDeleted: mtd,
    etag,
    caldavUrl: url,
    ICALString: compString
  };
};

/* Take Note that attendees with unconfirmed status do not have names */
const parseAttendees = properties =>
  properties.map(property => ({
    status: property.jCal[1].partstat,
    action: property.jCal[3],
    email: property.jCal[1].email,
    displayName:
      property.jCal[1].cn !== undefined
        ? property.jCal[1].cn
        : property.jCal[1].email
  }));

const expandRecurEvents = async results => {
  const db = await getDb();
  const nonMTDresults = results.filter(result => !result.isModifiedThenDeleted);
  const recurringEvents = nonMTDresults.filter(
    nonMTDresult => nonMTDresult.isRecurring
  );
  let merged = nonMTDresults;
  let finalResults = [];
  if (recurringEvents.length === 0) {
    finalResults = nonMTDresults;
  } else {
    finalResults = recurringEvents.map(async recurMasterEvent => {
      const recurPatternRecurId = await db.recurrencepatterns
        .find()
        .where('originalId')
        .eq(recurMasterEvent.originalId)
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
  }
  return finalResults;
};

const parseRecurrence = (pattern, recurMasterEvent) => {
  // debugger;
  const recurEvents = [];
  const ruleSet = buildRuleSet(pattern, recurMasterEvent);
  const recurDates = ruleSet.all().map(date => date.toJSON());
  const duration = getDuration(recurMasterEvent);
  recurDates.forEach(recurDateTime => {
    recurEvents.push({
      id: uniqid(),
      end: {
        dateTime: moment(recurDateTime)
          .add(duration)
          .toISOString(),
        timezone: 'timezone'
      },
      start: {
        dateTime: recurDateTime,
        timezone: 'timezone'
      },
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

const buildRuleSet = (pattern, master) => {
  const rruleSet = new RRuleSet();
  const ruleObject = buildRuleObject(pattern, master);
  rruleSet.rrule(new RRule(ruleObject));
  const { exDates } = pattern;
  exDates.forEach(exdate => rruleSet.exdate(new Date(exdate[3])));
  const { recurrenceIds } = pattern;
  recurrenceIds.forEach(recurDate => rruleSet.exdate(new Date(recurDate[3])));
  const modifiedThenDeletedDates = getModifiedThenDeletedDates(
    exDates,
    recurrenceIds
  );
  /* To remove start date duplicate */
  rruleSet.exdate(new Date(master.start.dateTime));
  return rruleSet;
};

const getDuration = master => {
  const start = moment(master.start.dateTime);
  const end = moment(master.end.dateTime);
  return moment.duration(end.diff(start));
};

const buildRuleObject = (pattern, master) => {
  const ruleObject = {};
  ruleObject.interval = pattern.interval;
  ruleObject.dtstart = new Date(master.start.dateTime);
  switch (pattern.freq) {
    case 'YEARLY':
      ruleObject.freq = 0;
      break;
    case 'MONTHLY':
      ruleObject.freq = 1;
      break;
    case 'WEEKLY':
      ruleObject.freq = 2;
      break;
    case 'DAILY':
      ruleObject.freq = 3;
      break;
    default:
  }
  ruleObject.until = pattern.until
    ? new Date(pattern.until)
    : TEMPORARY_RECURRENCE_END;
  return ruleObject;
};

const getModifiedThenDeletedDates = (exDates, recurDates) => {
  const modifiedThenDeletedDates = [];
  exDates.forEach(exdate => {
    recurDates.forEach(recurDate => {
      if (exdate[3] === recurDate[3]) {
        modifiedThenDeletedDates.push(exdate);
      }
    });
  });
  return modifiedThenDeletedDates;
};

export default {
  parseCal,
  parseCalEvents,
  parseEventPersons,
  parseRecurrenceEvents,
  expandRecurEvents,
  parseRecurrence
};
