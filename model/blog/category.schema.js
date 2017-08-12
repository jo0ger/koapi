/**
 * @desc 分类 Model
 * @author Jooger
 */

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createAt: { type: Number, default: Date.now },
  updateAt: Number,
  extends: [{ key: String, value: Object }]
})

categorySchema.plugin(mongoosePaginate)

export default categorySchema
