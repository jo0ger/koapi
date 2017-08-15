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
    commentlimit: { type: Number, default: 100 }
  },
  vps: {},
  project: {},
  music: {},
  gallery: {}
})

export default optionSchema
