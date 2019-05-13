import {
  UPDATE_STORED_EVENTS,
  SUCCESS_STORED_EVENTS,
  RETRIEVE_STORED_EVENTS,
  DUPLICATE_ACTION,
  SYNC_STORED_EVENTS
} from '../actions/db/events';

const initialState = {
  calEvents: []
};

const mergeEvents = (oldEvents, newItems) => {
  const oldIds = oldEvents.map(item => item.id);
  const newPayload = [...oldEvents];

  for (const newItem of newItems) {
    if (!oldIds.includes(newItem.id)) {
      newPayload.push(newItem);
    }
  }
  return newPayload;
};

const syncEvents = (oldEvents, newEvents) => {
  const newPayload = [...oldEvents];
  for (const newEvent of newEvents) {
    const result = oldEvents.find(oldEvent => newEvent.id === oldEvent.id);
    if (result === undefined) {
      // Means not found, push it in.
      newPayload.push(newEvent);
    } else {
      // Update the event.
      const pos = newPayload.map(object => object.id).indexOf(newEvent.id);
      console.log(pos);
      newPayload[pos] = newEvent;
    }
  }
  return newPayload;
};

export default function eventsReducer(state = initialState, action) {
  if (action === undefined) {
    return state;
  }
  switch (action.type) {
    case RETRIEVE_STORED_EVENTS:
      return Object.assign({}, state, { providerType: action.providerType });
    case UPDATE_STORED_EVENTS:
      return Object.assign({}, state, { calEvents: action.payload.resp });
    case SUCCESS_STORED_EVENTS: {
      const newEvents = mergeEvents(state.calEvents, action.payload);
      return Object.assign({}, state, { calEvents: newEvents });
    }
    case SYNC_STORED_EVENTS: {
      const newEvents = syncEvents(state.calEvents, action.payload);
      return Object.assign({}, state, { calEvents: newEvents });
    }
    case DUPLICATE_ACTION:
      return state;
    default:
      return state;
  }
}
