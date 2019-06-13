import React from 'react';
import ICAL from 'ical.js';

// Main Functions

export const getICALString = (eventObject) => {
  const ICALReadyEvent = trimEventObject(eventObject);
  const ICALEntries = Object.entries(ICALReadyEvent);
  const iCalendarData =
    'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'CALSCALE:GREGORIAN\n' +
    'BEGIN:VEVENT\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR';
  const jcalData = ICAL.parse(iCalendarData);
  const vcalendar = new ICAL.Component(jcalData);
  const vevent = vcalendar.getFirstSubcomponent('vevent');
  ICALEntries.forEach((entry) => vevent.updatePropertyWithValue(entry[0], entry[1]));
  debugger;
  return iCalendarData;
};

export const fromICALString = (string) => {};

export const updateICALString = (eventObject) => {};

export const updateModifiedICALString = (eventObject) => {};

// Helper Functions

const trimEventObject = (eventObject) => ({
  summary: eventObject.summary,
  description: eventObject.description,
  location: eventObject.location,
  tzid: 'US/Pacific',
  sequence: 0,
  uid: eventObject.originalId,
  created: eventObject.created,
  dtstart: eventObject.start.dateTime,
  dtend: eventObject.end.dateTime
});
