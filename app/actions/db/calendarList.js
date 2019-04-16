export const BEGIN_STORE_CALENDAR_LIST = 'BEGIN_STORE_CALENDAR_LIST';
export const SUCCESS_STORE_CALENDAR_LIST = 'SUCCESS_STORE_CALENDAR_LIST';
export const FAIL_STORE_CALENDAR_LIST = 'FAIL_STORE_CALENDAR_LIST';

export const RETRIEVE_STORED_CALENDAR_LIST = 'RETRIEVE_STORED_CALENDAR_LIST';
export const UPDATED_STORED_CALENDAR_LIST = 'UPDATED_STORED_CALENDAR_LIST';

export const beginStoringCalendarList = () => ({
  type: BEGIN_STORE_CALENDAR_LIST
});

export const successStoringCalendarList = () => ({
  type: SUCCESS_STORE_CALENDAR_LIST
});

export const failStoringCalendarList = () => ({
  type: FAIL_STORE_CALENDAR_LIST
});
