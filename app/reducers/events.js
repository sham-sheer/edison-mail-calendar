import {
  UPDATE_STORED_EVENTS,
  SUCCESS_STORED_EVENTS,
  RETRIEVE_STORED_EVENTS,
  DUPLICATE_ACTION
} from '../actions/db/events';
import {
  BEGIN_DELETE_CALENDAR_OBJECT,
  FAIL_DELETE_CALENDAR_OBJECT
} from '../actions/caldav';

const initialState = {
  calEvents: [],
  deletedEventId: '',
  deleteError: ''
};

const mergeEvents = (oldEvents, newItems) => {
  const oldIds = oldEvents.map(item => item.id);
  const newPayload = [...oldEvents];
  // console.log(oldEvents, newItems);

  for (const newItem of newItems) {
    if (!oldIds.includes(newItem.id)) {
      newPayload.push(newItem);
    }
  }
  return newPayload;
};

const hideEvent = (calEvents, deletedEventId) => {
  const newEvents = [];
  calEvents.forEach(calEvent => {
    if (calEvent.id !== deletedEventId) {
      newEvents.push(calEvent);
    }
  });
  return newEvents;
};

const addHideOperator = calEvents =>
  calEvents.map(calEvent => {
    calEvent.hide = false;
    return calEvent;
  });

export default function eventsReducer(state = initialState, action) {
  if (action === undefined) {
    return state;
  }
  switch (action.type) {
    case RETRIEVE_STORED_EVENTS:
      return Object.assign({}, state, { providerType: action.providerType });
    case UPDATE_STORED_EVENTS:
      // debugger;
      // return Object.assign({}, state, { calEvents: action.payload });
      // return Object.assign({}, state, { calEvents: state.calEvents.concat(action.payload) });
      // return Object.assign({}, state, { calEvents: mergeEvents(state.calEvents, action.payload) });
      const events = addHideOperator(action.payload);
      return Object.assign({}, state, { calEvents: events });
    case SUCCESS_STORED_EVENTS: {
      // debugger;
      const newEvents = mergeEvents(state.calEvents, action.payload);
      return Object.assign({}, state, { calEvents: newEvents });
    }
    case DUPLICATE_ACTION:
      return state;
    case BEGIN_DELETE_CALENDAR_OBJECT: {
      return Object.assign({}, state, { deletedEventId: action.payload });
    }
    case FAIL_DELETE_CALENDAR_OBJECT:
      return Object.assign({}, state, {
        deletedEventId: '',
        deleteError: action.payload
      });
    default:
      return state;
  }
}
