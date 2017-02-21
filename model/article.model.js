/**
 * 文章 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  keywords: [{type: String}],
  excerpt: String,
  content: String,
  thumb: {enable: Boolean, url: String, full: Boolean},
  // 文章状态 => -1 回收站  0 草稿  1 已发布
  state: { type: Number, default: 1 },
  create_at: Number,
  update_at: Number,
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  tag: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  extends: [{key: String, value: Object}]
})

articleSchema.plugin(mongoosePaginate)
articleSchema.plugin(autoIncrement.plugin, {
  model: 'Category',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

export default articleSchema
