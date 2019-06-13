export const GET_EVENTS_BEGIN = 'GET_EVENTS_BEGIN';
export const GET_EVENTS_SUCCESS = 'GET_EVENTS_SUCCESS';
export const GET_EVENTS_FAILURE = 'GET_EVENTS_FAILURE';

export const POST_EVENT_BEGIN = 'POST_EVENT_BEGIN';
export const POST_EVENT_SUCCESS = 'POST_EVENT_SUCCESS';
export const POST_EVENT_FAILURE = 'POST_EVENT_FAILURE';

export const MOVE_EVENT_BEGIN = 'BEGIN_MOVE_EVENT';
export const MOVE_EVENT_SUCCESS = 'MOVE_EVENT_SUCCESS';
export const MOVE_EVENT_FAILURE = 'MOVE_EVENT_FAILURE';

export const EDIT_EVENT_BEGIN = 'EDIT_EVENT_BEGIN';
export const EDIT_EVENT_SUCCESS = 'EDIT_EVENT_SUCCESS';
export const EDIT_EVENT_FAILURE = 'EDIT_EVENT_FAILURE';

export const EDIT_EVENT_BEGIN_CALDAV = 'EDIT_EVENT_BEGIN_CALDAV';

export const QUICK_ADD_EVENT_BEGIN = 'QUICK_ADD_EVENT_BEGIN';
export const QUICK_ADD_EVENT_SUCCESS = 'QUICK_ADD_EVENT_SUCCESS';
export const QUICK_ADD_EVENT_FAILURE = 'QUICK_ADD_EVENT_FAILURE';

export const UPDATE_EVENTS_BEGIN = 'UPDATE_EVENTS_BEGIN';
export const UPDATE_EVENTS_SUCCESS = 'UPDATE_EVENTS_SUCCESS';
export const UPDATE_EVENTS_FAILURE = 'UPDATE_EVENTS_FAILURE';

export const DELETE_EVENT_BEGIN = 'DELETE_EVENT_BEGIN';
export const DELETE_EVENT_SUCCESS = 'DELETE_EVENT_SUCCESS';
export const DELETE_EVENT_FAILURE = 'DELETE_EVENT_FAILURE';

export const DELETE_EVENT_BEGIN_API = 'DELETE_EVENT_BEGIN_API';
export const DELETE_EVENT_SUCCESS_API = 'DELETE_EVENT_SUCCESS_API';
export const DELETE_EVENT_FAILURE_API = 'DELETE_EVENT_FAILURE_API';

export const API_ERROR = 'API_ERROR';

export const beginGetGoogleEvents = resp => ({
  type: GET_EVENTS_BEGIN,
  payload: resp
});

export const postEventBegin = (calEvent, auth, providerType) => ({
  type: POST_EVENT_BEGIN,
  payload: {
    data: calEvent,
    auth,
    providerType
  }
});

export const getEventsFailure = error => ({
  type: GET_EVENTS_FAILURE,
  payload: {
    error
  }
});

export const getEventsSuccess = (response, providerType, owner) => ({
  type: GET_EVENTS_SUCCESS,
  payload: {
    data: response,
    providerType,
    owner // owner is needed as there are chances that the email is not readable for EXCHANGE servers.
  }
});

export const postEventSuccess = (response, providerType, owner) => ({
  type: POST_EVENT_SUCCESS,
  payload: {
    data: response,
    providerType,
    owner
  }
});

export const beginDeleteEvent = id => ({
  type: DELETE_EVENT_BEGIN,
  payload: id
});

export const deleteEventSuccess = id => ({
  type: DELETE_EVENT_SUCCESS,
  payload: id
});

// ---------------------- OUTLOOK ---------------------- //
export const GET_OUTLOOK_EVENTS_BEGIN = 'GET_OUTLOOK_EVENTS_BEGIN';
export const GET_OUTLOOK_EVENTS_SUCCESS = 'GET_OUTLOOK_EVENTS_SUCCESS';
export const GET_OUTLOOK_EVENTS_FAILURE = 'GET_OUTLOOK_EVENTS_FAILURE';

export const beginGetOutlookEvents = resp => ({
  type: GET_OUTLOOK_EVENTS_BEGIN,
  payload: resp
});

export const postOutlookEventBegin = calEvent => ({
  type: GET_OUTLOOK_EVENTS_FAILURE,
  payload: calEvent
});

export const getOutlookEventsSuccess = response => ({
  type: GET_OUTLOOK_EVENTS_SUCCESS,
  payload: {
    data: response
  }
});
// ---------------------- OUTLOOK ---------------------- //

// ---------------------- EDIT EVENTS ---------------------- //
export const editEventBegin = (id, eventObject, providerType) => ({
  type: EDIT_EVENT_BEGIN,
  payload: {
    id,
    data: eventObject,
    providerType
  }
});

export const editEventSuccess = resp => ({
  type: EDIT_EVENT_SUCCESS,
  payload: {
    resp
  }
});

export const apiFailure = error => ({
  type: API_ERROR,
  payload: {
    error
  }
});

export const editEventsBeginCaldav = currentEvent => ({
  type: EDIT_EVENT_BEGIN_CALDAV,
  payload: currentEvent
});
// ---------------------- EDIT EVENTS ---------------------- //

// ---------------------- EXCHANGE ---------------------- //
export const GET_EXCHANGE_EVENTS_BEGIN = 'GET_EXCHANGE_EVENTS_BEGIN';
export const GET_EXCHANGE_EVENTS_SUCCESS = 'GET_EXCHANGE_EVENTS_SUCCESS';
export const GET_EXCHANGE_EVENTS_FAILURE = 'GET_EXCHANGE_EVENTS_FAILURE';

export const beginGetExchangeEvents = resp => ({
  type: GET_EXCHANGE_EVENTS_BEGIN,
  payload: resp
});

export const getExchangeEventsSuccess = resp => ({
  type: GET_EXCHANGE_EVENTS_SUCCESS,
  payload: resp
});
// ---------------------- EXCHANGE ---------------------- //

// ---------------------- GENERAL ---------------------- //
export const CLEAR_ALL_EVENTS = 'CLEAR_ALL_EVENTS';
export const CLEAR_ALL_EVENTS_SUCCESS = 'CLEAR_ALL_EVENTS_SUCCESS';

export const clearAllEvents = () => ({
  type: CLEAR_ALL_EVENTS
});

export const clearAllEventsSuccess = () => ({
  type: CLEAR_ALL_EVENTS_SUCCESS
});
// ---------------------- GENERAL ---------------------- //
