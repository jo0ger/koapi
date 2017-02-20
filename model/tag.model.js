/**
 * 标签Model
 */

const mongoose = require('mongoose')
const autoIncrement = require('mongoose-auto-increment')
const mongoosePaginate = require('mongoose-paginate')

autoIncrement.initialize(mongoose.connection)

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alias: String,
  description: String,
  create_at: Number,
  update_at: Number,
  extends: [{key: String, value: Object}]
})

tagSchema.plugin(mongoosePaginate)
tagSchema.plugin(autoIncrement.plugin, {
  model: 'Tag',
  field: 'id',
  startAt: 1,
  incrementBy: 1
})

tagSchema.pre('save', next => {
  this.update_at = Date.now().getTime()
  if (this.isNew) {
    this.create_at = this.update_at
  }
  next()
})

export default mongoose.model('Tag', tagSchema)
