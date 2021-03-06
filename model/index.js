/**
 * @desc Models Entry
 * @author Jooger
 */

import mongoose from 'mongoose'
import { generate, firstUpperCase } from '../utils'
import commonSchemas from './common'
import blogSchemas from './blog'
import adminSchemas from './admin'

const models = {}
const schemas = {
  ...commonSchemas,
  ...blogSchemas,
  ...adminSchemas
}

Object.keys(schemas).forEach(key => {
  const schema = buildSchema(schemas[key])
  if (schema) {
    models[`${key}Model`] = mongoose.model(key, schema)
  }
})

// 构建schema
function buildSchema (schema) {
  if (!schema) {
    return null
  }
  schema.set('versionKey', false)
  schema.set('toObject', { getters: true })
  schema.set('toJSON', { getters: true, virtuals: false })
  schema.pre('findOneAndUpdate', updateHook)
  return schema
}

// 更新updateAt
function updateHook (next) {
  this.findOneAndUpdate({}, { updateAt: Date.now() })
  next && next()
}

export default models
