export default {
  title: 'Pending Action schema',
  version: 0,
  description: 'Describes a pending action object',
  type: 'object',
  properties: {
    eventId: {
      type: 'string',
      primary: true
    },
    status: {
      type: 'string'
    },
    type: {
      type: 'string'
    }
  },
  required: ['eventId', 'status', 'type']
};
