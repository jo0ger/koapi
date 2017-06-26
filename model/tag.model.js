/**
 * 标签Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  create_at: { type: Number, default: Date.now },
  update_at: Number,
  // 扩展项
  // icon color 等
  extends: [ { key: String, value: Object } ]
})

tagSchema.plugin(mongoosePaginate)
tagSchema.plugin(autoIncrement.plugin, {
  model: 'Tag',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

export default tagSchema
