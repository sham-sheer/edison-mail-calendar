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

    // recurrence id from caldav it is equal to the dtstart
    recurringTypeId: {
      type: 'string'
    },
    originalId: {
      type: 'string'
    },
    interval: {
      type: 'number'
    },
    frequency: {
      type: 'string'
    },
    maxNumberOfOccurences: {
      type: 'number'
    },
    dayOfWeek: {
      type: 'number'
    },
    weekOfMonth: {
      type: 'number'
    },
    dayOfMonth: {
      type: 'number'
    },
    monthOfYear: {
      type: 'number'
    }
  },
  required: ['recurringTypeId']
};
