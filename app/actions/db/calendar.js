export const BEGIN_STORE_CALENDAR = 'BEGIN_STORE_CALENDAR';
export const SUCCESS_STORE_CALENDAR = 'SUCCESS_STORE_CALENDAR';
export const FAIL_STORE_CALENDAR = 'FAIL_STORE_CALENDAR';

export const UPDATED_STORED_CALENDAR = 'UPDATED_STORED_CALENDAR';

export const beginStoringCalendar = () => ({ type: BEGIN_STORE_CALENDAR });

export const successStoringCalendar = () => ({ type: SUCCESS_STORE_CALENDAR });

export const failStoringCalendar = () => ({ type: FAIL_STORE_CALENDAR });
