import moment from 'moment';

// -- For UI purposes -- //
export const dayRecurrOptions = [];
export const weekRecurrOptions = [
  // default if no recurrance
  { value: 0, label: 'S', index: 0 },
  { value: 1, label: 'M', index: 1 },
  { value: 2, label: 'T', index: 2 },
  { value: 3, label: 'W', index: 3 },
  { value: 4, label: 'T', index: 4 },
  { value: 5, label: 'F', index: 5 },
  { value: 6, label: 'S', index: 6 }
];
export const monthRecurrOptions = (start, text) => [
  {
    value: 'day',
    label: `Monthly on day ${moment(start.dateTime).date()}`,
    index: 0
  },
  {
    value: 'weekandday',
    label: `Monthly on the ${text} ${moment(start.dateTime).format('dddd')}`,
    index: 1
  }
];
export const yearRecurrOptions = [];
// -- For UI purposes -- //

export const firstRecurrOptions = [
  { value: 'day', label: 'Day', index: 0 },
  { value: 'week', label: 'Week', index: 1 },
  { value: 'month', label: 'Month', index: 2 },
  { value: 'year', label: 'Year', index: 3 }
];

// -- For UI purposes -- //
export const secondRecurrOptions = (start, text) => ({
  day: dayRecurrOptions,
  week: weekRecurrOptions,
  month: monthRecurrOptions(start, text),
  year: yearRecurrOptions
});

export const thirdRecurrOptions = [
  { value: 'n', label: 'Never' },
  { value: 'o', label: 'On' },
  { value: 'a', label: 'After' }
];

export const selectedSecondRecurrOption = [0, [0, 0, 0, 0, 0, 0, 0], 0, 0];

// For converting database freq label to integer for UI selection of react-select
export const parseFreq = (freq) => {
  switch (freq) {
    case 'DAILY':
      return 0;
    case 'WEEKLY':
      return 1;
    case 'MONTHLY':
      return 2;
    case 'YEARLY':
      return 3;
    default:
      return -1;
  }
};

export const parseFreqByNumber = (number) => {
  switch (number) {
    case 0:
      return 'DAILY';
    case 1:
      return 'WEEKLY';
    case 2:
      return 'MONTHLY';
    case 3:
      return 'YEARLY';
    default:
      return -1;
  }
};

// For converting integer from UI to text
export const parseFreqNumber = (number) => {
  switch (number) {
    case 0:
      return 'day';
    case 1:
      return 'week';
    case 2:
      return 'month';
    case 3:
      return 'year';
    default:
      return -1;
  }
};

// For converting third choice of recurrence to label for UI.
export const parseThirdRecurrOption = (until, repeat) => {
  switch (until) {
    case '':
      if (repeat === null) {
        return 'n';
      }
      return 'a';
    default:
      return 'o';
  }
};

// For converting choice of UI to number for setting of state and updating of UI.
export const parseThirdRecurrLetter = (letter) => {
  switch (letter) {
    case 'n':
      return 0;
    case 'o':
      return 1;
    case 'a':
      return 2;
    default:
      return -1;
  }
};

// For UI printing, converts which week to a text like how google calendar does.
export const parseString = (number) => {
  switch (number) {
    case 1:
      return 'first';
    case 2:
      return 'second';
    case 3:
      return 'third';
    case 4:
      return 'fouth';
    case 5:
      return 'last';
    default:
      return 'what the fk';
  }
};
