/**
 * 设置 Model
 */

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const optionSchema = new mongoose.Schema({
  common: {
    dateFormat: { type: String, default: '' },
  },
  // 博客
  blog: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    keywords: { type: Array, default: [] },
    description: { type: String, default: '' },
    author: { type: String, default: config.info.author },
    siteUrl: { type: String, default: '' },
    siteEmail: String,
    language: { type: String, default: 'zh-Hans' },
    favicon: { type: String, default: '/favicon.ico' },
    socials: [{
      name: { type: String, required: true },
      link: { type: String, required: true },
      icon: String
    }],
    postLimit: { type: Number, default: 10 },
    commentlimit: { type: Number, default: 100 },
    // 发布垃圾评论加入黑名单的最大次数
    commentSpamLimit: { type: Number, default: 3 },
    blacklist: {
      ips: [{ type: String, validate: /\S+/ }],
      emails: [{ type: String, validate: /\S+/ }],
      forbidWords: [{ type: String, validate: /\S+/ }]
    }
  },
  vps: {
    apiKey: { type: String, default: '' }
  },
  project: {},
  music: {
    playListId: { type: String, default: '' }
  },
  gallery: {},
  thirdParty: {
    qiniu: {
      accessKey: { type: String, default: 'yvmsQiG7qdCesWCii3nMEMHK-8Ifi7EyRlcY1FmK' },
      secretKey: { type: String, default: 'G8pkqYNw9OFxcGUvwL_Gia7b_bhV_5ejMxsNZENl' },
      avaliableBuckets: [{
        name: { type: String, required: true, default: '' },
        origin: { type: String, required: true, default: '' },
        uploadUrl: { type: String, default: 'http://up-z1.qiniu.com/' }
      }]
    },
    akismet: {
      apiKey: { type:String, default: '7fa12f4a1d08' },
      activeSites: [{ type: String, default: 'blog.jooger.me' }]
    },
    github: {
      authorizeURL: { type: String, default: 'http://github.com/login/oauth/authorize' },
      accessTokenURL: { type: String, default: 'https://github.com/login/oauth/access_token' },
      userInfoUrl: { type: String, default: 'https://api.github.com/user' },
      clientId: { type: String, default: 'b4983366c4c7549a09f1' },
      clientSecret: { type: String, default: '76fd8c26a21659d7eb925af0ed3498eabed49277' },
      scope: [{ type: String, default: 'user' }]
    }
  }
})

export default optionSchema
