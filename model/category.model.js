/**
 * 分类 Model
 */

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  create_at: { type: Number, default: Date.now },
  update_at: Number,
  extends: [{ key: String, value: Object }]
})

categorySchema.plugin(mongoosePaginate)

export default categorySchema
