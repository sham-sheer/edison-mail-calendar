// @flow

import * as CalDavActions from '../actions';

export default function caldavReducer(state: calendar = '', action: Action) {
  switch (action.type) {
    case CalDavActions.CREATE_ACCOUNT:
      return state;
    case CalDavActions.CREATE_CALENDAR_OBJECT:
      return state;
    case CalDavActions.UPDATE_CALENDAR_OBJECT:
      return state;
    case CalDavActions.DELETE_CALENDAR_OBJECT:
      return state;
    case CalDavActions.SYNC_CALENDAR:
      return state;
    case CalDavActions.SYNC_CALDAV_ACCOUNT:
      return state;
    default:
      return state;
  }
}
