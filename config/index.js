const minimist = require('minimist')(process.argv)

export default {
  INFO: {
    name: 'Koapi',
    version: '1.0.0',
    author: 'BubblyPoker',
    site: 'http://bubblypoker.com'
  },
  SERVER: {
    ROOT_PATH: __dirname,
    LIMIT: 10,
    PORT: 3000,
    PREFIX: '/api',
    VERSION: 'v1',
    CODE: {
      FAILED: -1,
      SUCCESS: 0,
      INVALID_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      INTERNAL_SERVER_ERROR: 500
    }
  },
  MONGODB: {
    URI: 'mongodb://127.0.0.1/koapi',
    USERNAME: minimist.dbusername || 'DB_username',
    PASSWORD: minimist.dbpassword || 'DB_password'
  },
  AUTH: {
    SECRET_KEY: minimist.authKey || 'Koapi',
    EXPIRED: 60 * 60 * 24 * 365
  }
}
