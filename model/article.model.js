/**
 * 文章 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  keywords: [{ type: String }],
  excerpt: String,
  content: { type: String, required: true, validate: /\S+/ },
  rendered_content: { type: String, required: true, validate: /\S+/ },
  // 缩略图，enable 是否显示，url 缩略图url，full 是否突屏
  // thumb: { enable: { type: Boolean, default: false }, url: String, full: { type: Boolean, default: false } },
  thumbs: [{ name: String, url: String }],
  // 文章状态 => -1 回收站  0 草稿  1 已发布
  state: { type: Number, default: 1 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  meta: {
    visit: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  extends: [{
    key: { type: String, validate: /\S+/ },
    value: { type: String, validate: /\S+/ }
  }]
})

articleSchema.plugin(mongoosePaginate)
articleSchema.plugin(autoIncrement.plugin, {
  model: 'Article',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

export default articleSchema
