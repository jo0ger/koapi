/**
 * @desc koapi 配置
 * @author Jooger
 */

export default {
  INFO: {
    name: 'Koapi',
    version: '1.0.0',
    author: 'Jooger',
    site: 'http://jooger.me'
  },
  SERVER: {
    ROOT_PATH: __dirname,
    PORT: 5000,
    PREFIX: '/api',
    VERSION: 'v1.0',
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
  BLOG: {
    LIMIT: 10,
    COMMENT_LIMIT: 99,
    DATE_FORMAT: 'yyyy-MM-dd',
    DEFAULT_CATEGORY: [
      { name: 'CODE', description: 'CODE', extends: [{ color: '#108ee9'}] },
      { name: 'THINK', description: 'THINK', extends: [{ color: '#108ee9'}] }
    ]
  },
  MONGODB: {
    URI: 'mongodb://127.0.0.1/koapi'
  },
  AUTH: {
    SECRET_KEY: 'Koapi',
    EXPIRED: 60 * 60 * 24 * 365,
    DEFAULT_NAME: 'admin',
    DEFAULT_PASSWORD: 'admin'
  },
  QINIU: {
    accessKey: 'yvmsQiG7qdCesWCii3nMEMHK-8Ifi7EyRlcY1FmK',
    secretKey: 'G8pkqYNw9OFxcGUvwL_Gia7b_bhV_5ejMxsNZENl',
    bucket: 'jooger',
    origin: 'http://oqtnezwt7.bkt.clouddn.com',  // domain
    uploadUrl: 'http://up-z1.qiniu.com/'
  }
}
