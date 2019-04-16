export default {
  title: 'Person schema',
  version: 0,
  description: 'Describes a Person object',
  type: 'object',
  properties: {
    personId: {
      type: 'string',
      primary: true
    },
    originalId: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    providerType: {
      type: 'string'
    },
    accessToken: {
      type: 'string'
    },
    accessTokenExpiry: {
      type: 'number'
    },
    password: {
      type: 'string'
    }
  },
  required: ['personId', 'originalId']
};
