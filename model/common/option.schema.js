/**
 * 设置 Model
 */

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const config = require('../../config')

const optionSchema = new mongoose.Schema({
  // ============================
  // 站点相关
  // ============================
  title: { type: String, required: true },
  subtitle: String,
  keywords: String,
  description: [{ type: String, required: true }],
  author: { type: String, default: config.INFO.author },
  siteUrl: { type: String, required: true, default: config.INFO.site },
  siteEmail: String,
  language: { type: String, default: 'zh-Hans' },
  favicon: { type: String, default: '/favicon.ico' },
  socials: [{
    name: { type: String, required: true },
    link: { type: String, required: true },
    icon: String
  }],
  dateFormat: { type: String, default: config.BLOG.dateFormat },
  bannerDefaultImg: { type: String, required: true },
  banner: [{
    path: { type: String, required: true },
    title: String,
    subtitle: String,
    images: [{
      name: String,
      url: { type: String, required: true }
    }]
  }],
  // ============================
  // 文章相关
  // ============================
  pageSize: { type: Number, default: config.BLOG.LIMIT },
  // 代码高亮主题，normal | night | night eighties | night blue | night bright
  highlightTheme: { type: String, default: 'normal' },
  reward: {
    enable: { type: Boolean, default: true },
    comment: String,
    wechatpay: String,
    alipay: String
  }
  // ============================
  // 功能相关
  // ============================
})

export default optionSchema
