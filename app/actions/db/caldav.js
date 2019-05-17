export const BEGIN_STORE_CALDAV_OBJECTS = 'BEGIN_STORE_CALDAV_OBJECTS';
export const SUCCESS_STORE_CALDAV_OBJECTS = 'SUCCESS_STORE_CALDAV_OBJECTS';
export const FAIL_STORE_CALDAV_OBJECTS = 'FAIL_STORE_CALDAV_OBJECTS';

export const RETRIEVE_CALENDARS = 'RETRIEVE_CALENDARS';
export const UPDATE_CALENDARS = 'UPDATE_CALENDARS';
export const RETRIEVE_CALENDAR_BY_PERSON = 'RETRIEVE_CALENDAR_BY_PERSON';

export const RETRIEVE_EVENTS_BY_CALENDAR = 'RETRIEVE_EVENTS_BY_CALENDAR';
export const RETRIEVE_EVENTS_BY_PERSON = 'RETRIEVE_EVENTS_BY_PERSON';

export const beginStoreCaldavObjects = (payload) => ({
  type: BEGIN_STORE_CALDAV_OBJECTS,
  payload
});

export const successStoreCaldavObjects = (payload) => ({
  type: SUCCESS_STORE_CALDAV_OBJECTS,
  payload
});

export const failStoreCaldavObjects = (payload) => ({
  type: FAIL_STORE_CALDAV_OBJECTS,
  payload
});

export const retrieveStoreEventsByCal = (payload) => ({
  type: RETRIEVE_EVENTS_BY_CALENDAR,
  payload
});

export const retrieveCalByPerson = (payload) => ({
  type: RETRIEVE_CALENDAR_BY_PERSON,
  payload
});

export const retrieveCalendars = () => ({
  type: RETRIEVE_CALENDARS
});

export const updateCalendars = (payload) => ({
  type: UPDATE_CALENDARS,
  payload
});

export const retrieveEventsByCalendar = (payload) => ({
  type: RETRIEVE_EVENTS_BY_CALENDAR,
  payload
});

export const retrieveEventsByPerson = (payload) => ({
  type: RETRIEVE_EVENTS_BY_PERSON
});
