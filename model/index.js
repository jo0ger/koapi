/**
 * model entry
 */

const fs = require('fs')
const mongoose = require('mongoose')
const files = fs.readdirSync(__dirname)
let models = {}

files.every((file) => {
  if (file !== 'index.js' && file.slice(-3) === '.js') {
    let modelName = file.split('.')[0]
    let fileName = file.slice(0, -3)
    let schema = require(`./${fileName}`)
    // 先构建schema
    buildSchema(schema)
    // 再构建model
    models[modelName] = mongoose.model(firstUpperCase(modelName), schema)
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
  schema.pre('save', timeHook)
  schema.pre('update', timeHook)
}

// save和update的时间钩子
function timeHook (next) {
  this.update({ update_at: Date.now() })
  if (this.isNew) {
    this.update({ create_at: Date.now() })
  }
  next()
}

// 首字母大写
function firstUpperCase(str) {
  return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
}

export default models
