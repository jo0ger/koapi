/**
 * @desc 标签 Model
 * @author Jooger
 */

import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate'

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },
  // 扩展项
  // icon color 等
  extends: [ { key: String, value: Object } ]
})

tagSchema.plugin(mongoosePaginate)

export default tagSchema
