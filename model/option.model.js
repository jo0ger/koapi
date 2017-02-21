/**
 * 设置 Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const optionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sub_title: String,
  keywords: [{ type: String}],
  description: String,
  author: { type: String, default: 'BubblyPoker' },
  site_url: { type: String, required: true },
  site_email: String,
  language: { type: String, default: 'zh-Hans' },
})

export default optionSchema
