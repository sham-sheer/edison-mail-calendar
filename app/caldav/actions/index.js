export const BEGIN_CREATE_ACCOUNT = 'BEGIN_CREATE_ACCOUNT';
export const SUCCESS_CREATE_ACCOUNT = 'SUCCESS_CREATE_ACCOUNT';
export const FAIL_CREATE_ACCOUNT = 'FAIL_CREATE_ACCOUNT';

export const BEGIN_CREATE_CALENDAR_OBJECT = 'BEGIN_CREATE_CALENDAR_OBJECT';
export const SUCCESS_CREATE_CALENDAR_OBJECT = 'SUCCESS_CREATE_CALENDAR_OBJECT';
export const FAIL_CREATE_CALENDAR_OBJECT = 'CREATE_CALENDAR_OBJECT';

export const BEGIN_UPDATE_CALENDAR_OBJECT = 'BEGIN_UPDATE_CALENDAR_OBJECT';
export const SUCCESS_UPDATE_CALENDAR_OBJECT = 'SUCCESS_UPDATE_CALENDAR_OBJECT';
export const FAIL_UPDATE_CALENDAR_OBJECT = 'FAIL_UPDATE_CALENDAR_OBJECT';

export const BEGIN_DELETE_CALENDAR_OBJECT = 'BEGIN_DELETE_CALENDAR_OBJECT';
export const SUCCESS_DELETE_CALENDAR_OBJECT = 'SUCCESS_DELETE_CALENDAR_OBJECT';
export const FAIL_DELETE_CALENDAR_OBJECT = 'FAIL_DELETE_CALENDAR_OBJECT';

export const BEGIN_SYNC_CALENDAR = 'BEGIN_SYNC_CALENDAR';
export const SUCCESS_SYNC_CALENDAR = 'SUCCESS_SYNC_CALENDAR';
export const FAIL_SYNC_CALENDAR = 'FAIL_SYNC_CALENDAR';

export const BEGIN_SYNC_CALDAV_ACCOUNT = 'BEGIN_SYNC_CALDAV_ACCOUNT';
export const SUCCESS_SYNC_CALDAV_ACCOUNT = 'SUCCESS_SYNC_CALDAV_ACCOUNT';
export const FAIL_SYNC_CALDAV_ACCOUNT = 'FAIL_SYNC_CALDAV_ACCOUNT';

export const beginCreateAccount = payload => ({
  type: BEGIN_CREATE_ACCOUNT,
  payload
});
export const successCreateAcount = payload => ({
  type: SUCCESS_CREATE_ACCOUNT,
  payload
});
export const failCreateAccount = error => ({
  type: FAIL_CREATE_ACCOUNT,
  error
});

export const beginCreateCalendarObject = payload => ({
  type: BEGIN_CREATE_CALENDAR_OBJECT,
  payload
});
export const successCreateCalendarObject = payload => ({
  type: SUCCESS_CREATE_CALENDAR_OBJECT,
  payload
});
export const failCreateCalendarObject = error => ({
  type: FAIL_CREATE_CALENDAR_OBJECT,
  error
});

export const beginUpdateCalendarObject = payload => ({
  type: BEGIN_UPDATE_CALENDAR_OBJECT,
  payload
});
export const successUpdateCalendarObject = payload => ({
  type: SUCCESS_UPDATE_CALENDAR_OBJECT,
  payload
});
export const failUpdateCalendarObject = error => ({
  type: FAIL_UPDATE_CALENDAR_OBJECT,
  error
});

export const beginDeleteCalendarObject = payload => ({
  type: BEGIN_DELETE_CALENDAR_OBJECT,
  payload
});
export const successDeleteCalendarObject = payload => ({
  type: SUCCESS_DELETE_CALENDAR_OBJECT,
  payload
});
export const failDeleteCalendarObject = error => ({
  type: FAIL_DELETE_CALENDAR_OBJECT,
  error
});

export const beginSyncCalendar = payload => ({
  type: BEGIN_SYNC_CALENDAR,
  payload
});
export const successSyncCalendar = payload => ({
  type: SUCCESS_SYNC_CALENDAR,
  payload
});
export const failSyncCalendar = error => ({ type: FAIL_SYNC_CALENDAR, error });

export const beginSyncCalDav = payload => ({
  type: BEGIN_SYNC_CALDAV_ACCOUNT,
  payload
});
export const successSyncCalDav = payload => ({
  type: SUCCESS_SYNC_CALDAV_ACCOUNT,
  payload
});
export const failSyncCalDav = error => ({
  type: FAIL_SYNC_CALDAV_ACCOUNT,
  error
});

/* DB Actions for Caldav */

export const BEGIN_STORE_CALDAV_OBJECTS = 'BEGIN_STORE_CALDAV_OBJECTS';
export const SUCCESS_STORE_CALDAV_OBJECTS = 'SUCCESS_STORE_CALDAV_OBJECTS';
export const FAIL_STORE_CALDAV_OBJECTS = 'FAIL_STORE_CALDAV_OBJECTS';

export const beginStoreCaldavObjects = payload => ({
  type: BEGIN_STORE_CALDAV_OBJECTS,
  payload
});
