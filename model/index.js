/**
 * @desc Models Entry
 * @author Jooger
 */

import mongoose from 'mongoose'
import { generate, firstUpperCase } from '../utils'
import commonSchemas from './common'
import blogSchemas from './blog'

const models = {}
const schemas = {
  ...commonSchemas,
  ...blogSchemas
}

Object.keys(schemas).forEach(key => {
  models[`${key}Model`] = mongoose.model(key, buildSchema(schemas[key]))
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

// 更新update_at
function updateHook (next) {
  this.findOneAndUpdate({}, { update_at: Date.now() })
  next && next()
}

export default models
