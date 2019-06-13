import React from 'react';
import ICAL from 'ical.js';
import moment from 'moment';

export const buildICALStringUpdateOnly = (updatedEvent, calendarObject) => {
  debugger;
  const calendarData = ICAL.parse(calendarObject.ICALString);
  const calendarComp = new ICAL.Component(calendarData);
  const timezoneMetadata = calendarComp.getFirstSubcomponent('vtimezone');
  calendarComp.removeSubcomponent('vtimezone');
  const iCalendarData = 'BEGIN:VEVENT\nEND:VEVENT\n';
  const jcalData = ICAL.parse(iCalendarData);
  const vevent = new ICAL.Component(jcalData);
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now());
  vevent.updatePropertyWithValue('summary', updatedEvent.summary);
  vevent.updatePropertyWithValue('location', updatedEvent.location);
  vevent.updatePropertyWithValue('tzid', 'US/Pacific');
  vevent.updatePropertyWithValue('sequence', 0);
  vevent.updatePropertyWithValue('recurrence-id', updatedEvent.start);
  vevent.getFirstProperty('recurrence-id').setParameter('tzid', 'US/Pacific');
  vevent.updatePropertyWithValue('uid', calendarObject.iCalUID);
  vevent.updatePropertyWithValue('created', ICAL.Time.now());
  vevent.updatePropertyWithValue('dtstart', updatedEvent.start);
  vevent.getFirstProperty('dtstart').setParameter('tzid', 'US/Pacific');
  vevent.updatePropertyWithValue('dtend', updatedEvent.end);
  vevent.getFirstProperty('dtend').setParameter('tzid', 'US/Pacific');

  vevent.updatePropertyWithValue('x-apple-travel-advisory-behavior', 'AUTOMATIC');
  vevent.updatePropertyWithValue('transp', 'OPAQUE');
  calendarComp.addSubcomponent(vevent);
  calendarComp.addSubcomponent(timezoneMetadata);
  debugger;
  return calendarComp.toString();
};

export const buildICALStringUpdateAll = (eventObject) => {
  const calendarData = ICAL.parse(eventObject.ICALString);
  const calendarComp = new ICAL.Component(calendarData);
  const vevent = calendarComp.getFirstSubcomponent('vevent');
  vevent.updatePropertyWithValue('dtstamp', ICAL.Time.now());
  vevent.updatePropertyWithValue('summary', eventObject.summary);
  vevent.updatePropertyWithValue('location', eventObject.location);
  vevent.updatePropertyWithValue('tzid', 'US/Pacific');
  vevent.updatePropertyWithValue('sequence', 0);
  vevent.updatePropertyWithValue('uid', eventObject.iCalUID);
  vevent.updatePropertyWithValue('created', eventObject.created);
  vevent.updatePropertyWithValue('dtstart', eventObject.start.dateTime);
  vevent.getFirstProperty('dtstart').setParameter('tzid', 'US/Pacific');
  vevent.updatePropertyWithValue('dtend', eventObject.end.dateTime);
  vevent.getFirstProperty('dtend').setParameter('tzid', 'US/Pacific');
  return calendarComp.toString();
};

export const buildICALStringDeleteRecurEvent = (recurPattern, exDate, eventObject) => {
  debugger;
  const calendarData = ICAL.parse(eventObject.ICALString);
  const vcalendar = new ICAL.Component(calendarData);
  const vevent = vcalendar.getFirstSubcomponent('vevent');
  vevent.addPropertyWithValue('exdate', exDate);
  return vcalendar.toString();
};

export const fromICALString = (string, value) => {};

export const toICALString = (string) => {};

export const updateICALString = (eventObject) => {};

export const updateModifiedICALString = (eventObject) => {};
