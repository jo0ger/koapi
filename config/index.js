/**
 * @desc koapi 配置
 * @author Jooger
 */

import path from 'path'
import packageInfo from '../package.json'

export default {
  info: {
    name: packageInfo.name,
    version: packageInfo.version,
    author: packageInfo.author,
    email: packageInfo.email,
    site: packageInfo.site
  },
  server: {
    rootPath: path.resolve(__dirname, '../'),
    port: 5000,
    version: packageInfo.apiVersion,
    protocol: 'http',
    code: {
      FAILED: -1,
      SUCCESS: 0,
      INVALID_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
      INTERNAL_SERVER_ERROR: 500
    },
    mongodb: {
      uri: 'mongodb://127.0.0.1/koapi'
    },
    auth: {
      cookieName: 'JOOGER_AUTH',
      secretKey: `${packageInfo.name} ${packageInfo.version}`,
      // token过期时间
      expired: 60 * 60 * 24 * 365,
      defaultName: 'admin',
      defaultPassword: 'admin',
      // 允许请求的域名
      allowedOrigins: [
        'jooger.me',
        'www.jooger.me',
        'blog.jooger.me',
        'admin.jooger.me',
        'project.jooger.me',
        'gallery.jooger.me'
      ]
    }
  }
  // thirdParty: {
  //   qiniu: {
  //     accessKey: 'yvmsQiG7qdCesWCii3nMEMHK-8Ifi7EyRlcY1FmK',
  //     secretKey: 'G8pkqYNw9OFxcGUvwL_Gia7b_bhV_5ejMxsNZENl',
  //     bucket: 'jooger',
  //     origin: 'http://oqtnezwt7.bkt.clouddn.com',  // domain
  //     uploadUrl: 'http://up-z1.qiniu.com/'
  //   },
  //   github: {
  //     authorizeURL: 'http://github.com/login/oauth/authorize',
  //     accessTokenURL: 'https://github.com/login/oauth/access_token',
  //     userInfoUrl: 'https://api.github.com/user',
  //     clientId: 'b4983366c4c7549a09f1',
  //     clientSecret: '76fd8c26a21659d7eb925af0ed3498eabed49277',
  //     scope: ['user']
  //   }
  // }
  // module: {
  //   common: {
  //     dateFormat: 'yyyy-MM-dd',
  //   },
  //   blog: {
  //     postLimit: 20,
  //     commentlimit: 99
  //     // defaultCategory: [
  //     //   { name: 'CODE', description: 'CODE IS THINK', extends: [{ color: '#108ee9'}] },
  //     //   { name: 'THINK', description: 'THINK CHANGE CODE', extends: [{ color: '#108ee9'}] }
  //     // ]
  //   },
  //   project: {},
  //   music: {},
  //   vps: {},
  //   picture: {}
  // }
}
