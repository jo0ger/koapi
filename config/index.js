const minimist = require('minimist')(process.argv)

module.exports = {
  INFO: {
    name: 'Koapi',
    version: '1.0.0',
    author: 'BubblyPoker',
    site: 'http://bubblypoker.com'
  },
  SERVER: {
    ROOT_PATH: __dirname,
    LIMIT: 10,
    COMMENT_LIMIT: 99,
    PORT: 5000,
    PREFIX: '/api',
    VERSION: 'v1',
    CODE: {
      FAILED: -1,
      SUCCESS: 0,
      INVALID_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
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
    EXPIRED: 60 * 60 * 24 * 365,
    DEFAULT_NAME: minimist.defaultname || 'admin',
    DEFAULT_PASSWORD: minimist.defaultpassword || 'admin'
  },
  QINIU: {
    accessKey: 'yvmsQiG7qdCesWCii3nMEMHK-8Ifi7EyRlcY1FmK',
    secretKey: 'G8pkqYNw9OFxcGUvwL_Gia7b_bhV_5ejMxsNZENl',
    bucket: 'koapi',
    origin: 'http://koapi.u.qiniudn.com',
    uploadURL: 'http://up.qiniu.com/'
  }
}
