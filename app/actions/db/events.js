export const BEGIN_STORE_EVENTS = 'BEGIN_STORE_EVENTS';
export const FAIL_STORE_EVENTS = 'FAIL_STORE_EVENTS';
export const SUCCESS_STORED_EVENTS = 'SUCCESS_STORED_EVENTS';
export const UPDATE_STORED_EVENTS = 'UPDATE_STORED_EVENTS';

export const RETRIEVE_STORED_EVENTS = 'RETRIEVE_STORED_EVENTS';

export const DELETE_EVENT_BEGIN_DB = 'DELETE_EVENT_BEGIN_DB';

export const DUPLICATE_ACTION = 'DUPLICATE_ACTION';

export const failStoringEvents = () => ({
  type: FAIL_STORE_EVENTS
});
export const retrieveStoreEvents = providerType => ({
  type: RETRIEVE_STORED_EVENTS,
  payload: providerType
});

export const updateStoredEvents = resp => ({
  type: UPDATE_STORED_EVENTS,
  payload: resp
});

export const duplicateAction = () => ({
  type: DUPLICATE_ACTION
});

export const successStoringEvents = payload => ({
  type: SUCCESS_STORED_EVENTS,
  payload
});

export const beginStoringEvents = payload => ({
  type: BEGIN_STORE_EVENTS,
  payload
});
