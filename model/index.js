/**
 * @desc Models Entry
 * @author Jooger
 */

import mongoose from 'mongoose'
import { generate, firstUpperCase } from '../utils'
const models = {}

generate(__dirname, (filename, schema) => {
  const modelName = firstUpperCase(filename).split('.')[0]
  // 先构建schema
  buildSchema(schema)
  // 再构建model
  models[`${modelName}Model`] = mongoose.model(modelName, schema)
})

// 构建schema
function buildSchema (schema) {
  if (!schema) {
    return
  }
  schema.set('versionKey', false)
  schema.set('toObject', { getters: true })
  schema.set('toJSON', { getters: true, virtuals: false })
  schema.pre('findOneAndUpdate', updateHook)
}

// 更新update_at
function updateHook (next) {
  this.findOneAndUpdate({}, { update_at: Date.now() })
  next && next()
}

export default models
