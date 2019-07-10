export default {
  title: 'Recurrence Schema',
  version: 0,
  description: 'Describes a recurrence pattern of a recurring event',
  type: 'object',
  properties: {
    // unique id for each recurrence pattern object
    id: {
      type: 'string',
      primary: true
    },
    recurringTypeId: {
      type: 'string'
    },
    originalId: {
      type: 'string'
    },
    freq: {
      type: 'string'
    },
    interval: {
      type: 'number',
      default: 1
    },
    until: {
      type: 'string'
    },
    count: {
      type: 'number'
    },
    wkst: {
      type: 'string'
    },
    bysetpos: {
      type: 'string'
    },
    bymonth: {
      type: 'string'
    },
    bymonthday: {
      type: 'string'
    },
    byyearday: {
      type: 'string'
    },
    byweekno: {
      type: 'string'
    },
    byweekday: {
      type: 'array'
    },
    byhour: {
      type: 'string'
    },
    byminute: {
      type: 'string'
    },
    bysecond: {
      type: 'string'
    },
    byeaster: {
      type: 'string'
    },
    exDates: {
      type: 'array'
    },
    recurrenceIds: {
      type: 'array'
    },
    modifiedThenDeleted: {
      type: 'boolean'
    },
    weeklyPattern: {
      type: 'array'
    },
    numberOfRepeats: {
      type: 'number',
      default: 0
    },
    isCount: {
      type: 'boolean'
    }
  }
};
