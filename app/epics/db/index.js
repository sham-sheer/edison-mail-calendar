import * as authEpics from './auth';
import * as caldavEpics from './caldav';
import * as eventPersonsEpics from './eventPersons';
import * as eventEpics from './events';

export default {
  ...authEpics,
  ...caldavEpics,
  ...eventPersonsEpics,
  ...eventEpics
};
