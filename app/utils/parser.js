import React from 'react';
import ICAL from 'ical.js';
import moment from 'moment';
import uniqid from 'uniqid';

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
        exDates: calEvent.exdates,
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
    const jcalData = ICAL.parse(calevent.calendarData);
    const ics = calevent.data.href;
    const { etag } = calevent;
    let mtd = false;
    if (jcalData.length > 0) {
      const comp = new ICAL.Component(jcalData);
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
      const exdates = [];

      if (vevent.hasProperty('exdate')) {
        const exdateProps = vevent.getAllProperties('exdate');
        exdateProps.forEach(exdate => exdates.push(exdate.jCal));
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
          mtd
        );
        parsedEvents.push({
          ics,
          etag,
          rruleJSON,
          recurringInterval,
          exdates,
          recurrenceIds,
          data: eventParsed
        });
      } else {
        vevents.forEach(recurvevent => {
          mtd = isModifiedThenDeleted(recurvevent, exdates);
          const eventParsed = parseICALEvent(
            recurvevent,
            attendees,
            ICALEvent.isRecurring(),
            calendarId,
            creator,
            mtd
          );
          parsedEvents.push({
            ics,
            etag,
            rruleJSON,
            recurringInterval,
            exdates,
            recurrenceIds,
            data: eventParsed
          });
        });
      }
    }
  });
  return parsedEvents;
};

const isModifiedThenDeleted = (recurEvent, exdates) => {
  let isMtd = false;
  if (exdates === 0 || !recurEvent.hasProperty('recurrence-id')) {
    return isMtd;
  }
  const recurId = recurEvent.getFirstProperty('recurrence-id').jCal[3];
  exdates.forEach(exdate => {
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
  mtd
) => {
  const dtstart = vevent.getFirstPropertyValue('dtstart');
  const dtend = vevent.getFirstPropertyValue('dtend');
  const duration = getNormalizedDuration(dtstart, dtend);

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
    isModifiedThenDeleted: mtd
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

const getNormalizedDuration = (dtstart, dtend) => {
  const duration = dtend.subtractDate(dtstart);

  delete duration.wrappedJSObject;

  return duration;
};

const getNormalizedEndDate = (endDate, duration) => {
  const allDayEvent = duration.days > 0 || duration.weeks > 0;

  // CalDav saves the end date of all day events as the start of the next day
  // To fix this, we subtract one second from the end date
  return allDayEvent
    ? moment(endDate)
        .subtract(1, 'seconds')
        .toISOString()
    : endDate.toISOString();
};

const getNormalOccurenceEventData = (nextEvent, vevent, attendee) => {
  const dtstart = nextEvent.startDate;
  const dtend = nextEvent.endDate;
  const { summary: title, uid, location, description } = nextEvent.item;
  const duration = getNormalizedDuration(dtstart, dtend);

  return {
    title,
    uid,
    location,
    description,
    start: new Date(dtstart).toISOString(),
    end: getNormalizedEndDate(new Date(dtend), duration),
    duration,
    type: { recurring: true, edited: false },
    createdAt: new Date(vevent.getFirstPropertyValue('created')).toISOString(),
    attendee
  };
};

const expandRecurringEvent = (
  vevents,
  vevent,
  ICALEvent,
  modifiedOccurences,
  ics,
  attendees,
  etag
) => {
  const expand = new ICAL.RecurExpansion({
    component: vevent,
    dtstart: vevent.getFirstPropertyValue('dtstart')
  });

  const parsedRecurringEvents = [];
  for (let i = 0; i < 10; i += 1) {
    const nextOccuranceTime = expand.next();

    if (!expand.complete) {
      // Handle this next expanded occurence
      const nextEvent = ICALEvent.getOccurrenceDetails(nextOccuranceTime);

      const eventData = {};

      if (modifiedOccurences.length === 0) {
        // No events have been modified
        parsedRecurringEvents.push({
          ics,
          etag,
          data: getNormalOccurenceEventData(nextEvent, vevent, attendees)
        });
      } else if (isModified(nextOccuranceTime, modifiedOccurences)) {
        // This is the event that has been modified
        const key =
          getModifiedOccuranceKey(nextOccuranceTime, modifiedOccurences) || 0;

        parsedRecurringEvents.push({
          ics,
          etag,
          data: getModifiedOccurenceEventData(vevents[key], attendees)
        });
      } else {
        // Expand this event normally
        parsedRecurringEvents.push({
          ics,
          etag,
          data: getNormalOccurenceEventData(nextEvent, vevent, attendees)
        });
      }
    }
  }
  return parsedRecurringEvents;
};

const isModified = (occurence, modifiedOccurances) =>
  modifiedOccurances.some(
    modifiedOcc => modifiedOcc['recurrence-id'].compare(occurence) === 0
  );

const getModifiedOccuranceKey = (occurence, modifiedOccurances) => {
  const key = modifiedOccurances.forEach(modifiedOcc => {
    if (modifiedOcc['recurrence-id'].compare(occurence) === 0) {
      return modifiedOcc.key;
    }
    return null;
  });

  return key;
};

const getModifiedOccurenceEventData = (vevent, attendee) => {
  const dtstart = vevent.getFirstPropertyValue('dtstart');
  const dtend = vevent.getFirstPropertyValue('dtend');
  const duration = getNormalizedDuration(dtstart, dtend);

  return {
    title: vevent.getFirstPropertyValue('summary'),
    uid: vevent.getFirstPropertyValue('uid'),
    location: vevent.getFirstPropertyValue('location'),
    description: vevent.getFirstPropertyValue('description'),
    start: new Date(dtstart).toISOString(),
    end: getNormalizedEndDate(new Date(dtend), duration),
    duration,
    type: { recurring: true, edited: true },
    createdAt: new Date(vevent.getFirstPropertyValue('created')).toISOString(),
    attendee
  };
};

export default {
  parseCal,
  parseCalEvents,
  parseEventPersons,
  parseRecurrenceEvents,
  expandRecurringEvent
};
