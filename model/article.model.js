/**
 * 文章 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

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

categorySchema.plugin(mongoosePaginate)
categorySchema.plugin(autoIncrement.plugin, {
  model: 'Category',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

categorySchema.pre('save', next => {
  this.update_at = Date.now().getTime()
  if (this.isNew) {
    this.create_at = this.update_at
  }
  next()
})

export default mongoose.model('Article', articleSchema)
