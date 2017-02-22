/**
 * 设置 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const optionSchema = new mongoose.Schema({
  // ============================
  // 基本信息
  // ============================
  title: { type: String, required: true },
  sub_title: String,
  keywords: [{ type: String}],
  description: String,
  author: { type: String, default: 'BubblyPoker' },
  site_url: { type: String, required: true },
  site_email: String,
  language: { type: String, default: 'zh-Hans' },
  // 主题，Muse | Mist | Pisces
  theme: { type: String, default: 'Pisces' },
  // ============================
  // Post settings              
  // ============================
  // 代码高亮主题，normal | night | night eighties | night blue | night bright
  highlight_theme: { type: String, default: 'normal' }
})

export default optionSchema
