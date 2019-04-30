// const eventSchema =  {
//   "title": 'event schema',
//   "version": 0,
//   "description": 'describes a calendar event',
//   "type": 'object',
//   "properties": {
//     "id": {
//       'type': 'string',
//       'primary': true
//     },
//     "summary": {
//       'type': 'string',
//       'default' : 'Calendar Event'
//     },
//     "start": {
//       "type": "object",
//       "properties": {
//           "dateTime": {
//               "type": "string"
//           },
//           "timezone": {
//               "type": "string"
//           }
//       }
//     },
//     "end": {
//       "type": "object",
//       "properties": {
//           "dateTime": {
//               "type": "string"
//           },
//           "timezone": {
//               "type": "string"
//           }
//       }
//     },
//     "allDay": {
//       'type': 'boolean'
//     },
//     "organizer": {
//       "type":"object",
//       "properties": {
//         "id": "string",
//         "email": "string",
//         "displayName": "string",
//         "self": "boolean"
//       }
//     },
//     "recurrence" : {
//       "type": "array",
//       "item": {
//         "type": "string"
//       }
//     },
//     "iCalUID": {
//       "type": "string"
//     },
//     "attendees": {
//       "type": "array",
//       "item": {
//         "type": "object",
//         "properties": {
//             "id": "string",
//             "email": "string",
//             "displayName": "string",
//             "organizer": "boolean",
//             "self": "boolean",
//             "resource": "boolean",
//             "optional": "boolean",
//             "responseStatus": "string",
//             "comment": "string",
//             "additionalGuests": "number"
//         }
//       }
//     }
//   },
//   "required": ['end', 'start']
// }

// export default eventSchema;

export default {
  title: 'Event schema',
  version: 0,
  description: 'Describes a calendar event',
  type: 'object',
  properties: {
    // ----------------------------------------------- //
    id: {
      type: 'string',
      primary: true
    },
    originalId: {
      type: 'string'
    },
    // ----------------------------------------------- //
    htmlLink: {
      type: 'string'
    },
    status: {
      type: 'string',
      default: 'confirmed'
    },
    created: {
      type: 'string'
    },
    updated: {
      type: 'string'
    },
    summary: {
      type: 'string'
    },
    description: {
      type: 'string',
      default: 'confirmed'
    },
    location: {
      type: 'string',
      default: 'confirmed'
    },
    colorId: {
      type: 'string'
    },
    creator: {
      type: 'string'
    },
    organizer: {
      type: 'string'
    },
    // ----------------------------------------------- //
    start: {
      type: 'object',
      properties: {
        dateTime: {
          type: 'string'
        },
        timezone: {
          type: 'string'
        }
      }
    },
    end: {
      type: 'object',
      properties: {
        dateTime: {
          type: 'string'
        },
        timezone: {
          type: 'string'
        }
      }
    },
    endTimeUnspecified: {
      type: 'boolean',
      default: false
    },
    // ----------------------------------------------- //
    recurrence: {
      type: 'array',
      item: {
        type: 'string'
      }
    },
    recurringEventId: {
      type: 'string'
    },
    originalStartTime: {
      type: 'object',
      properties: {
        dateTime: {
          type: 'string'
        },
        timezone: {
          type: 'string'
        }
      }
    },
    // ----------------------------------------------- //
    transparency: {
      type: 'string'
    },
    visibility: {
      type: 'string'
    },
    // ----------------------------------------------- //
    iCalUID: {
      type: 'string'
    },
    sequence: {
      type: 'number'
    },
    // ----------------------------------------------- //
    attendee: {
      type: 'array'
    },
    // ----------------------------------------------- //
    anyoneCanAddSelf: {
      type: 'boolean'
    },
    guestsCanInviteOthers: {
      type: 'boolean'
    },
    guestsCanModify: {
      type: 'boolean'
    },
    guestsCanSeeOtherGuests: {
      type: 'boolean'
    },
    privateCopy: {
      type: 'boolean'
    },
    locked: {
      type: 'boolean'
    },
    allDay: {
      type: 'boolean'
    },
    // ----------------------------------------------- //
    calendarId: {
      type: 'string'
    },
    hangoutLink: {
      type: 'string'
    },
    source: {
      type: 'object',
      properties: {
        url: {
          type: 'string'
        },
        title: {
          type: 'string'
        }
      }
    },
    providerType: {
      type: 'string'
    },
    // ----------------------------------------------- //
    owner: {
      // email that it belongs to as exchange users might not have email
      type: 'string'
    },
    incomplete: {
      // incomplete is a flag to mark that it was just created and might not be complete
      type: 'boolean'
    },
    metaData: {
      type: 'object'
    },
    isRecurring: {
      type: 'boolean'
    }
  },
  required: ['end', 'start']
};
