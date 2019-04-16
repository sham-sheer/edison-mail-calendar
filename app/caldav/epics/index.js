import { combineEpics } from 'redux-observable';
import * as caldavEpics from './caldav';

export default combineEpics(...Object.values(caldavEpics));
