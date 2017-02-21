/**
 * 分类 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  alias: String,
  description: String,
  create_at: { type: Number, default: Date.now },
  update_at: Number,
  extends: [{key: String, value: Object}]
})

categorySchema.plugin(mongoosePaginate)
categorySchema.plugin(autoIncrement.plugin, {
  model: 'Category',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

export default categorySchema
