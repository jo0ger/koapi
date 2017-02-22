/**
 * model entry
 */

const fs = require('fs')
const mongoose = require('mongoose')
const files = fs.readdirSync(__dirname)
let models = {}

files.every((file) => {
  if (file !== 'index.js' && file.slice(-3) === '.js') {
    let modelName = firstUpperCase(file.split('.')[0])
    let fileName = file.slice(0, -3)
    let schema = require(`./${fileName}`)
    // 先构建schema
    buildSchema(schema)
    // 再构建model
    models[`${modelName}Model`] = mongoose.model(modelName, schema)
  }
  return true
})

// 构建通用的schema
function buildSchema (schema) {
  if (!schema) {
    return
  }
  schema.set('versionKey', false)
  schema.set('toObject', { getters: true })
  schema.set('toJSON', { getters: true, virtuals: false })
  schema.post('update', updateHook)
}

// 更新update_at
function updateHook () {
  this.update({}, { $set: { update_at: Date.now() }})
}

// 首字母大写
function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export default models
